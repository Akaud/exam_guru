// Footer.js
import React from 'react';
import '../Footer.css'; // Optional: If you want to style your footer

const Footer = () => {
  return (
    <footer className="footer">
      <div className="content has-text-centered">
        <p>
          <strong>Exam Guru</strong> by Levchenko Vladyslav
        </p>
        <p>
          {/*<a href="/privacy-policy">Privacy Policy</a> | <a href="/terms-of-service">Terms of Service</a>*/}
        </p>
        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
