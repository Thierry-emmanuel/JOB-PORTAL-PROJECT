import apiClient from './client';

export const getSalaryByCategory = async () => {
  const { data } = await apiClient.get('/api/v1/insights/salary-by-category');
  return data;
};

export const getDemandTrends = async () => {
  const { data } = await apiClient.get('/api/v1/insights/demand-trends');
  return data;
};

const insightsService = {
  getSalaryByCategory,
  getDemandTrends
};

export default insightsService;
