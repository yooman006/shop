import "./About.css";

const AboutUs = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>About Lakshmi Grocery</h1>
        <p>Providing fresh and quality groceries at the best prices.</p>
      </section>
      
      {/* About Section */}
      <section className="about-content">
        <h2>Who We Are</h2>
        <p>
          Lakshmi Grocery is your trusted neighborhood store, offering a wide range of fresh produce, dairy, and essential groceries.
          We take pride in delivering quality products with great customer service.
        </p>
      </section>
      
     
    </div>
  );
};

export default AboutUs;
