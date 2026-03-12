const sanitizePhoneNumber = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/[\s()-]/g, "").trim();
};

const normalizePhoneNumber = (value) => {
  const sanitizedPhone = sanitizePhoneNumber(value);

  if (!sanitizedPhone) {
    return sanitizedPhone;
  }

  const egyptMobileWithCountryCode = sanitizedPhone.match(/^\+?20(1[0125]\d{8})$/);
  if (egyptMobileWithCountryCode) {
    return `+20${egyptMobileWithCountryCode[1]}`;
  }

  const egyptMobileLocal = sanitizedPhone.match(/^0(1[0125]\d{8})$/);
  if (egyptMobileLocal) {
    return `+20${egyptMobileLocal[1]}`;
  }

  const egyptMobileWithoutPrefix = sanitizedPhone.match(/^(1[0125]\d{8})$/);
  if (egyptMobileWithoutPrefix) {
    return `+20${egyptMobileWithoutPrefix[1]}`;
  }

  return sanitizedPhone;
};

const buildPhoneSearchVariants = (value) => {
  const sanitizedPhone = sanitizePhoneNumber(value);
  const normalizedPhone = normalizePhoneNumber(value);

  const variants = new Set();

  if (sanitizedPhone) {
    variants.add(sanitizedPhone);
  }

  if (normalizedPhone) {
    variants.add(normalizedPhone);

    const normalizedEgyptPhone = normalizedPhone.match(/^\+20(1[0125]\d{8})$/);
    if (normalizedEgyptPhone) {
      const localCore = normalizedEgyptPhone[1];
      variants.add(localCore);
      variants.add(`0${localCore}`);
      variants.add(`20${localCore}`);
    }
  }

  return [...variants];
};

module.exports = {
  normalizePhoneNumber,
  buildPhoneSearchVariants,
};