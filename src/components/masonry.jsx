import React from 'react';

const MasonryLayout = ({ images }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div key={index} className="col-span-1">
          <a href={image.src} data-fslightbox="gallery">
            <img src={image.src} alt={image.alt} />
          </a>
        </div>
      ))}
    </div>
  );
};

export default MasonryLayout;