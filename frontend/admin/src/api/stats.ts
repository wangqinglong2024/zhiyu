import client from './client';

// 统计数据相关 API

/** 获取总览统计数据 */
export async function getOverview() {
  const res = await client.get('/admin/stats/overview');
  return res.data.data;
}

/** 获取收入折线图数据 */
export async function getRevenueChart() {
  const res = await client.get('/admin/stats/revenue-chart');
  return res.data.data;
}
