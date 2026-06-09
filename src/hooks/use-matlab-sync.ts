import { useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, onSnapshot, getDocs, doc, updateDoc, query, where, addDoc } from "firebase/firestore";
import { MatlabEngine } from "@/lib/matlab-engine";

export function useMatlabSync() {
  useEffect(() => {
    // Listen to new inspections to trigger recalculations
    const unsubInspections = onSnapshot(collection(db, "inspections"), async (snap) => {
      // For simplicity in this demo, if any inspection changes, we recount defects and run MATLAB on affected segments.
      // In a real prod app, we'd only run on the modified `change.doc`.
      
      for (const change of snap.docChanges()) {
        if (change.type === 'added' || change.type === 'modified') {
          const insp = change.doc.data();
          if (insp.segment_id) {
            await runMatlabForSegment(insp.segment_id);
          }
        }
      }
    });

    const unsubAlerts = onSnapshot(collection(db, "alerts"), async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === 'added') {
          const alert = change.doc.data();
          if (alert.segment_id) {
             // Treat an emergency alert as severe weather/risk factor spike
             await runMatlabForSegment(alert.segment_id, { weatherSpike: true });
          }
        }
      }
    });

    return () => {
      unsubInspections();
      unsubAlerts();
    };
  }, []);
}

export async function runMatlabForSegment(segmentId: string, options?: { weatherSpike?: boolean }) {
  try {
    // 1. Fetch current segment state
    const segSnap = await getDocs(query(collection(db, "railway_segments"), where("__name__", "==", segmentId)));
    if (segSnap.empty) return;
    const segment = segSnap.docs[0].data();

    // 2. Fetch defect count
    const defectsSnap = await getDocs(query(collection(db, "track_defects"), where("section_name", "==", segment.route_name), where("status", "==", "open")));
    const openDefects = defectsSnap.size;

    // 3. Fetch last inspection
    const inspSnap = await getDocs(query(collection(db, "inspections"), where("segment_id", "==", segmentId)));
    let daysSinceInspection = 30; // default
    if (!inspSnap.empty) {
      // Sort to get latest
      const latest = inspSnap.docs.map(d => d.data()).sort((a,b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime())[0];
      const diffTime = Math.abs(new Date().getTime() - new Date(latest.inspection_date).getTime());
      daysSinceInspection = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 4. Run MATLAB Simulation
    const simResult = MatlabEngine.runFullSimulation({
      currentHealth: segment.health_score || 100,
      currentRisk: segment.risk_score || 0,
      daysSinceInspection,
      openDefects,
      weatherFactor: options?.weatherSpike ? 1.0 : 0.2 // simulate weather
    });

    // 5. Update Firebase with MATLAB outputs
    let newStatus = segment.status;
    if (simResult.maintenancePriority === "CRITICAL") newStatus = "critical";
    else if (simResult.maintenancePriority === "HIGH") newStatus = "maintenance";
    else if (simResult.maintenancePriority === "MEDIUM") newStatus = "warning";
    else newStatus = "healthy";

    await updateDoc(doc(db, "railway_segments", segmentId), {
      health_score: simResult.healthScore,
      risk_score: simResult.riskScore,
      status: newStatus,
      matlab_last_run: new Date().toISOString()
    });

    // 6. Record prediction if probability is high
    if (simResult.failureProbability > 30) {
      await addDoc(collection(db, "predictions"), {
        segment_id: segmentId,
        predicted_failure: simResult.predictedFailure,
        repair_time: simResult.estimatedRepairTimeHours,
        probability: simResult.failureProbability,
        created_at: new Date().toISOString()
      });
    }

    console.log(`MATLAB Sync complete for ${segment.route_name}`);
  } catch (error) {
    console.error("MATLAB sync failed", error);
  }
}
