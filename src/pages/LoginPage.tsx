import { useState, type FormEvent } from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { Navigate, useNavigate } from 'react-router-dom'
import { authenticate } from '../api/authApi'
import { authFailed, authenticated, authStarted } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, error } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('user1@teploshchit.local')
  const [password, setPassword] = useState('Teplo123!')

  if (user) return <Navigate to="/catalog" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    dispatch(authStarted())
    try {
      dispatch(authenticated(await authenticate(email, password)))
      navigate('/catalog')
    } catch {
      dispatch(authFailed('Неверный email или пароль'))
    }
  }

  return (
    <main className="form-page">
      <Container className="content-shell page-section">
        <div className="form-card">
          <span className="eyebrow">Redux UI state + Axios</span>
          <h1>Вход</h1>
          <p>Сервер сохранит HttpOnly-cookie <code>sessionId</code>. Redux не гидратируется, поэтому F5 вернёт гостевой UI.</p>
          <Form onSubmit={(event) => void submit(event)}>
            <Form.Group><Form.Label>Email</Form.Label><Form.Control type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Form.Group>
            <Form.Group><Form.Label>Пароль</Form.Label><Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></Form.Group>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <Button type="submit">Войти</Button>
          </Form>
        </div>
      </Container>
    </main>
  )
}
