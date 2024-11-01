import React from 'react';
import '../Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="content has-text-centered">
        <p>
          <strong>Exam Guru</strong> by Levchenko Vladyslav
        </p>
        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
