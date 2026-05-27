import apiClient from './client';

const BASE_PUBLIC = '/api/public/hero';
const BASE_ADMIN  = '/api/admin/hero';

/**
 * PUBLIC — no auth required.
 * Called by KoraHome on every page load to get the live hero config.
 */
export const fetchLiveHero = async () => {
  const { data } = await apiClient.get(BASE_PUBLIC);
  return data;
};

/**
 * ADMIN — requires ROLE_ADMIN JWT.
 * Returns the current config (may differ from live if isActive=false).
 */
export const fetchAdminHero = async () => {
  const { data } = await apiClient.get(BASE_ADMIN);
  return data;
};

/**
 * ADMIN — save / upsert hero config.
 * @param {object} config  — matches HeroConfigDTO.Request shape
 */
export const saveHeroConfig = async (config) => {
  const { data } = await apiClient.put(BASE_ADMIN, config);
  return data;
};

/**
 * ADMIN — reset hero to platform defaults.
 */
export const resetHeroConfig = async () => {
  const { data } = await apiClient.post(`${BASE_ADMIN}/reset`);
  return data;
};