export const canonicalProductionUrl = ({ hostname, pathname, search, hash }) =>
  hostname === 'limitlessbrainlab.com'
    ? `https://www.limitlessbrainlab.com${pathname}${search}${hash}`
    : null;
