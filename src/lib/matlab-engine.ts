/**
 * MATLAB Engineering Simulation Engine
 * 
 * Simulates MATLAB outputs for track degradation forecasting, failure probability estimation,
 * repair time prediction, and railway health scoring.
 */

interface TrackInput {
  currentHealth: number;
  currentRisk: number;
  daysSinceInspection: number;
  openDefects: number;
  weatherFactor: number; // 0.0 to 1.0 (1.0 = severe weather)
}

export const MatlabEngine = {
  /**
   * 1. Track degradation forecasting & 4. Railway health scoring
   * Simulates non-linear degradation over time.
   */
  simulateDegradation: (input: TrackInput): { newHealth: number; newRisk: number; priority: string } => {
    // Degradation is faster if health is already low (exponential decay simulation)
    const decayFactor = Math.pow(1.05, input.daysSinceInspection / 30);
    const defectPenalty = input.openDefects * 2.5;
    const weatherPenalty = input.weatherFactor * 5;
    
    let newHealth = input.currentHealth - ((decayFactor + defectPenalty + weatherPenalty) * 0.1);
    newHealth = Math.max(0, Math.min(100, Math.round(newHealth * 10) / 10));

    // Risk increases inversely to health, but scales up with defects
    let newRisk = 100 - newHealth + (input.openDefects * 5) + (input.weatherFactor * 10);
    newRisk = Math.max(0, Math.min(100, Math.round(newRisk * 10) / 10));

    let priority = "LOW";
    if (newRisk > 80 || newHealth < 30) priority = "CRITICAL";
    else if (newRisk > 50 || newHealth < 60) priority = "HIGH";
    else if (newRisk > 30 || newHealth < 80) priority = "MEDIUM";

    return { newHealth, newRisk, priority };
  },

  /**
   * 2. Failure probability estimation
   * Uses logistic regression simulation to estimate failure within 30 days.
   */
  calculateFailureProbability: (health: number, risk: number, defects: number): number => {
    // Logit function simulation
    const logit = -5.0 + (0.1 * risk) - (0.05 * health) + (0.8 * defects);
    const probability = 1 / (1 + Math.exp(-logit));
    return Math.round(probability * 100);
  },

  /**
   * 3. Repair time prediction
   * Based on risk level and defect counts
   */
  predictRepairTimeHours: (health: number, risk: number, defects: number): number => {
    const baseHours = defects === 0 ? 0 : 2;
    const conditionPenalty = (100 - health) * 0.2; // up to 20 hours
    const riskPenalty = risk * 0.15; // up to 15 hours
    const complexityFactor = defects > 2 ? 1.5 : 1.0;
    
    return Math.round((baseHours + conditionPenalty + riskPenalty) * complexityFactor);
  },

  /**
   * Full Digital Twin Simulation run
   */
  runFullSimulation: (input: TrackInput) => {
    const { newHealth, newRisk, priority } = MatlabEngine.simulateDegradation(input);
    const failureProb = MatlabEngine.calculateFailureProbability(newHealth, newRisk, input.openDefects);
    const repairTime = MatlabEngine.predictRepairTimeHours(newHealth, newRisk, input.openDefects);
    
    let predictedFailureType = "None";
    if (failureProb > 70) predictedFailureType = "Critical Rail Fracture";
    else if (failureProb > 40) predictedFailureType = "Severe Alignment Shift";
    else if (failureProb > 20) predictedFailureType = "Ballast Degradation";
    
    return {
      healthScore: newHealth,
      riskScore: newRisk,
      maintenancePriority: priority,
      failureProbability: failureProb,
      predictedFailure: predictedFailureType,
      estimatedRepairTimeHours: repairTime,
      recommendedCrewSize: failureProb > 60 ? Math.max(4, input.openDefects * 2) : 2
    };
  }
};
