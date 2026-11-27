import { useState } from 'react'
import { useStore } from '../../data/storeContext'
import { Avatar, Card, CardHeader, Field, Input } from '../../components/UI'
import { Icon } from '../../components/Icons'

export default function CustomerLogin({ navigate }) {
  const { customerSession, loginCustomer, logoutCustomer } = useStore()
  const [phone, setPhone] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const customer = loginCustomer({ phone })
    if (customer) navigate('track')
  }

  return (
    <div className="stack-lg">
      <Card className="card-pad">
        <CardHeader
          title="Customer Portal"
          subtitle="Sign in with your registered mobile number to follow your bike's service status."
          icon="user"
        />
        {customerSession ? (
          <div className="stack-md">
            <div className="job-status-strip">
              <Avatar name={customerSession.name} size="sm" />
              <div>
                <strong>{customerSession.name}</strong>
                <small>{customerSession.phone}</small>
              </div>
            </div>
            <div className="form-actions">
              <span className="muted small">
                You are signed in to the customer portal.
              </span>
              <div className="form-action-buttons">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('track')}
                >
                  <Icon name="search" size={15} />
                  Track my bike service
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={logoutCustomer}
                >
                  <Icon name="log-out" size={15} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <Field
                label="Mobile number"
                htmlFor="customer-phone"
                className="span-2"
                required
                hint="Use the mobile number registered with the workshop."
              >
                <Input
                  id="customer-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="98765 43210"
                  inputMode="tel"
                  required
                />
              </Field>
              <div className="form-actions span-2">
                <span className="muted small">
                  Individual customer login — one mobile number, one account.
                </span>
                <div className="form-action-buttons">
                  <button type="submit" className="btn btn-primary">
                    <Icon name="check" size={15} />
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
