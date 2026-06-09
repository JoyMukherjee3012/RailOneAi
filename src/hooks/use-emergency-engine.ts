import { useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

export function useEmergencyEngine() {
  useEffect(() => {
    // Keep track of segments we've already alerted for to avoid spamming
    const alertedSegments = new Set<string>();

    const checkCriticalSegments = async () => {
      const q = query(collection(db, "railway_segments"), where("status", "==", "critical"));
      const snap = await getDocs(q);
      snap.docs.forEach((docSnap) => {
        const seg = { id: docSnap.id, ...docSnap.data() } as any;
        if (!alertedSegments.has(seg.id)) {
          alertedSegments.add(seg.id);
          triggerEmergency(seg);
        }
      });
    };

    const triggerEmergency = async (segment: any) => {
      // Create Alert
      await addDoc(collection(db, "alerts"), {
        segment_id: segment.id,
        alert_type: "Critical Track Failure Detected",
        severity: "emergency",
        created_at: new Date().toISOString()
      });

      // Create Incident
      // Pick the first coordinate for the incident location
      let lat = 0, lng = 0;
      if (Array.isArray(segment.path) && segment.path.length > 0) {
        lat = segment.path[0].lat;
        lng = segment.path[0].lng;
      }
      
      await addDoc(collection(db, "incidents"), {
        incident_type: `Track Failure: ${segment.route_name}`,
        severity: "critical",
        status: "active",
        latitude: lat,
        longitude: lng,
        description: `Automated alert: Track ${segment.track_id} on ${segment.route_name} has reached critical status (Health: ${segment.health_score}, Risk: ${segment.risk_score}). Immediate response recommended.`,
        created_at: new Date().toISOString()
      });

      toast.error(`EMERGENCY: Critical failure on ${segment.route_name}. Emergency response protocols activated.`, {
        duration: 10000,
        action: { label: "View Details", onClick: () => window.location.href = '/digital-twin' }
      });
    };

    checkCriticalSegments();

    const q = query(collection(db, "railway_segments"), where("status", "==", "critical"));
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const seg = { id: change.doc.id, ...change.doc.data() } as any;
          if (!alertedSegments.has(seg.id)) {
            alertedSegments.add(seg.id);
            triggerEmergency(seg);
          }
        }
      });
    });

    return () => unsub();
  }, []);
}
