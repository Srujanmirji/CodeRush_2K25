

export interface TeamRegistration {
  teamName: string;

  // Team Leader
  leaderName: string;
  leaderPhone: string;
  leaderEmail: string;
  leaderSemester: string;
  leaderBranch: string;
  leaderUSN: string;

  // Member 2
  member2Name: string;
  member2Phone: string;
  member2Email: string;
  member2Semester: string;
  member2Branch: string;
  member2USN: string;

  // Payment
  paymentScreenshot?: File | null;
}

export interface ProblemStatement {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface AdminDashboardData {
  _rowIndex?: number; // Added for unique row targeting
  "Registration ID": string;
  "Timestamp": string;
  "Team Name": string;
  "Leader Name": string;
  "Leader Email": string;
  "Leader Phone": string;
  "Leader Branch": string;
  "Leader USN": string;
  "Leader Sem": string;
  "Member 2 Name": string;
  "Member 2 Email": string;
  "Member 2 Phone": string;
  "Member 2 Branch": string;
  "Member 2 USN": string;
  "Member 2 Sem": string;
  "Payment Screenshot URL": string;
  "Status": string;
}