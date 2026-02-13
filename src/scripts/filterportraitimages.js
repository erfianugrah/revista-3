export async function filterPortraitImages(imageUrls) {
  const results = await Promise.all(
    imageUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve(img.naturalHeight > img.naturalWidth ? url : null);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }),
  );

  return results.filter((url) => url !== null);
}
