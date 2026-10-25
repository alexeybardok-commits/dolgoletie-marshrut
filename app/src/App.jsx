
import { useState, useEffect } from 'react'
import './App.css'

const activities = [
  {
    id: 1,
    title: 'Скандинавская ходьба',
    category: 'Активность',
    district: 'Центр',
    price: 'Бесплатно',
  },
  {
    id: 2,
    title: 'Йога для начинающих',
    category: 'Здоровье',
    district: 'Академический',
    price: '500 ₽',
  },
  {
    id: 3,
    title: 'Рисование для взрослых',
    category: 'Творчество',
    district: 'Центр',
    price: '700 ₽',
  },
]

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#home">Долголетие Маршрут</a>
      <nav aria-label="Основная навигация">
        <a href="#activities">Занятия</a>
        <a href="#my-plan">Мой план</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">ЗАНЯТИЯ ДЛЯ АКТИВНОЙ ЖИЗНИ ПОСЛЕ 60</p>
        <h1>Найдите регулярные занятия для себя или близкого человека</h1>
        <p className="hero-description">
          Выбирайте занятия по интересам, району, расписанию и стоимости
          и собирайте удобный план.
        </p>
        <div className="hero-actions">
          <a className="hero-button" href="#activities">Смотреть занятия</a>
          <a className="hero-button-secondary" href="#activities">
            Помочь подобрать
          </a>
        </div>
        <p className="hero-note">
          Ответьте на несколько вопросов — мы поможем выбрать занятия.
        </p>
      </div>
      <img
        src="/hero-photo.png"
        alt="Мужчина и женщина гуляют вместе в парке"
        className="hero-photo"
      />
    </section>
  )
}

function ActivityCard({ activity }) {
  return (
    <article className="activity-card">
      <span className="category">{activity.category}</span>
      <h3>{activity.title}</h3>
      <p>Район: {activity.district}</p>
      <p>Стоимость: {activity.price}</p>
      <a href="#my-plan">Подробнее</a>
    </article>
  )
}


function App() {
  const [category, setCategory] = useState('Все')
  const [district, setDistrict] = useState('Все')

  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('myPlan') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('myPlan', JSON.stringify(selectedIds))
  }, [selectedIds])

  const filteredActivities = activities.filter((activity) => {
    const categoryMatches =
      category === 'Все' || activity.category === category

    const districtMatches =
      district === 'Все' || activity.district === district

    return categoryMatches && districtMatches
  })

  const selectedActivities = activities.filter((activity) =>
    selectedIds.includes(activity.id)
  )

  function toggleActivity(id) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    )
  }

  return (
    <>
      <Header />

      <main>
        <Hero />

        <section className="section" id="activities">
          <h2>Каталог занятий</h2>

          <div className="filters">
            <label>
              Категория
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Все</option>
                <option>Активность</option>
                <option>Здоровье</option>
                <option>Творчество</option>
              </select>
            </label>

            <label>
              Район
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              >
                <option>Все</option>
                <option>Центр</option>
                <option>Академический</option>
              </select>
            </label>
          </div>

          <p>Найдено занятий: {filteredActivities.length}</p>

          <div className="activity-grid">
            {filteredActivities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <span className="category">{activity.category}</span>
                <h3>{activity.title}</h3>
                <p>Район: {activity.district}</p>
                <p>Стоимость: {activity.price}</p>

                <button
                  type="button"
                  onClick={() => toggleActivity(activity.id)}
                >
                  {selectedIds.includes(activity.id)
                    ? 'Убрать из плана'
                    : 'Добавить в план'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="my-plan">
          <h2>Мой план ({selectedActivities.length})</h2>

          {selectedActivities.length === 0 ? (
            <p>Вы пока не добавили ни одного занятия.</p>
          ) : (
            <div className="activity-grid">
              {selectedActivities.map((activity) => (
                <article className="activity-card" key={activity.id}>
                  <h3>{activity.title}</h3>
                  <p>Район: {activity.district}</p>
                  <p>Стоимость: {activity.price}</p>
                  <button
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                  >
                    Удалить из плана
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}


export default App
