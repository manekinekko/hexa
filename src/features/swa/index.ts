import dbg from "debug";
const debug = dbg("swa");


export default async function () {
  const { default: create } = await import('./create');
  if (process.env.HEXA_AUTO_MODE) {
    debug('auto');
    return await create('AUTOMATIC');
  }
  else {
    debug('manual');
    return await create("MANUAL");
  }

};