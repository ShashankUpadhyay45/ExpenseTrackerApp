export const reportService = {
  generateMonthlyReport: async (userId: string, month: string) => { return { url: '/reports/monthly.pdf' }; }
};