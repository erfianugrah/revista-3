const MasonryLayout = ({ images }) => {
  return (
    <div style={{columnCount: 4, columnGap: '1em'}}>
      {images.map((image, index) => (
        <div key={index} style={{breakInside: 'avoid', marginBottom: '1em'}}>
          <a href={image.src} data-fslightbox="gallery" style={{display: 'inline-block', margin: 0, padding: 0}}>
            <img src={image.src} alt={image.alt} loading="lazy" style={{display: 'block', margin: 0, padding: 0}} />
          </a>
        </div>
      ))}
    </div>
  );
};

export default MasonryLayout;