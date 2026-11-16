export interface DashboardType {
  foods: {
    total: number;
    scoreSummary: Record<0 | 0.25 | 0.5 | 0.75 | 1, number>;
  };
  shopLists: {
    latest: {
      date: Date;
      bought: number;
      snoozed: number;
    };
    total: number;
  };
  swipes: {
    latest: {
      date: Date;
      swiped: number;
    };
    total: number;
  };
}
