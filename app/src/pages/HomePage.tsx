import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <>
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">ЗАНЯТИЯ ДЛЯ АКТИВНОЙ ЖИЗНИ ПОСЛЕ 60</p>
        <h1>Найдите регулярные занятия для себя или близкого человека</h1>
        <p className="hero-description">
          Выбирайте занятия по интересам, району, расписанию и стоимости и собирайте удобный план.
        </p>
        <div className="hero-actions">
          <Link className="hero-button" to="/activities">Смотреть занятия</Link>
          <Link className="hero-button-secondary" to="/help-select">
            Помочь подобрать
          </Link>
        </div>
        <p className="hero-note">
          Ответьте на несколько вопросов — мы настроим фильтры каталога под ваши предпочтения.
        </p>
      </div>
      <img
        src="/hero-photo.png"
        alt="Мужчина и женщина гуляют вместе в парке"
        className="hero-photo"
      />
    </section>
    <section className="section how-it-works" aria-labelledby="how-title">
      <h2 id="how-title">Как это работает</h2>
      <ol className="steps">
        <li><span aria-hidden="true">01</span><h3>Найдите занятия</h3></li>
        <li><span aria-hidden="true">02</span><h3>Изучите условия</h3></li>
        <li><span aria-hidden="true">03</span><h3>Соберите план</h3></li>
      </ol>
    </section>
    </>
  )
}
