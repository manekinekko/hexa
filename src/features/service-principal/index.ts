export default async function() {
  const { default: create } = await import('./create');
  return await create();
};
