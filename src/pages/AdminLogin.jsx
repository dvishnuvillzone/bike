import { useState } from 'react'
import { useStore } from '../data/storeContext'
import { Card, CardHeader, Field, Input } from '../components/UI'
import { Icon } from '../components/Icons'

export default function AdminLogin({ navigate }) {
  const { loginTechnician } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const technician = loginTechnician({ username, password })
    if (technician) navigate('admin')
  }

  return (
    <div className="stack-lg">
      <Card className="card-pad">
        <CardHeader
          title="Admin Login"
          subtitle="Sign in with your workshop admin or technician account."
          icon="shield"
        />
        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <Field
              label="Username"
              htmlFor="admin-username"
              className="span-2"
              required
              hint="e.g. arjun.mehta"
            >
              <Input
                id="admin-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="arjun.mehta"
                required
              />
            </Field>
            <Field
              label="Password"
              htmlFor="admin-password"
              className="span-2"
              required
              hint="e.g. arjun123"
            >
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            <div className="form-actions span-2">
              <span className="muted small">
                Individual admin login — one technician account, one session.
              </span>
              <div className="form-action-buttons">
                <button type="submit" className="btn btn-primary">
                  <Icon name="shield" size={15} />
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
