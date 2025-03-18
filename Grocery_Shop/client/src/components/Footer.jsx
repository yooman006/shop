import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className='border-t'>
      <div className='container mx-auto p-4 text-center flex flex-col lg:flex-row lg:justify-between gap-2'>
        <p>© All Rights Reserved 2025.</p>

        <div className='flex items-center gap-4 justify-center text-2xl'>
          <Link to="/about-us" className='hover:text-primary-100'>About us</Link>
          <a href='' className='hover:text-primary-100'>
            <FaFacebook />
          </a>
          <a href='' className='hover:text-primary-100'>
            <FaInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
