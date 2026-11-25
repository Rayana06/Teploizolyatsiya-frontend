import { Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../api/authApi'
import { signedOut } from '../store/authSlice'
import { resetFilters } from '../store/filtersSlice'
import { clearPrivateMaterials } from '../store/materialsSlice'

export function BottomNav() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const items = [
    { to: '/', icon: 'bi-house-door', label: 'Лента', enabled: true },
    { to: '/add', icon: 'bi-plus-circle', label: 'Добавление', enabled: Boolean(user) },
    { to: '/catalog', icon: 'bi-grid', label: 'Плитка', enabled: true },
    { to: '/login', icon: user ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right', label: user ? 'Выход' : 'Вход', enabled: true, logout: Boolean(user) },
  ]

  const signOut = async () => {
    try { await logout() } finally {
      dispatch(signedOut())
      dispatch(resetFilters())
      dispatch(clearPrivateMaterials())
    }
  }

  return (
    <Nav className="bottom-nav" aria-label="Основная навигация">
      <div className="bottom-nav__inner">
        {items.map((item) => item.enabled ? item.logout ? (
          <button key={item.label} type="button" className="bottom-nav__item bottom-nav__button" onClick={() => void signOut()}>
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        ) : (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ) : (
          <span key={item.label} className="bottom-nav__item disabled" aria-disabled="true" title="Недоступно гостю">
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </Nav>
  )
}
