import '../styles/MasonryLayout.css';

const MasonryLayout = ({ images }) => {
  return (
    <div className="masonry">
      {images.map((image, index) => (
        <div key={index} className="image-container">
          <a href={image.src} data-fslightbox="gallery" className="image-link">
            <img src={image.src} alt={image.alt} loading="lazy" className="image" />
          </a>
        </div>
      ))}
    </div>
  );
};

export default MasonryLayout;