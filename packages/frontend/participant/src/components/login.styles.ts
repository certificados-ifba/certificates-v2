import styled from 'styled-components'

export const LoginWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: ${props => props.theme.colors.primary};
`

export const LoginCard = styled.form`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.12);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${props => props.theme.colors.darkShade};
  }

  p {
    font-size: 0.875rem;
    color: ${props => props.theme.colors.darkTint};
  }
`

export const LoginLogo = styled.div`
  align-self: flex-start;
  background: ${props => props.theme.colors.primary};
  border-radius: 10px;
  padding: 8px 14px;

  img {
    height: 34px;
    display: block;
  }
`

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${props => props.theme.colors.darkTint};

  input {
    height: 44px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid ${props => props.theme.colors.medium};
    font-size: 1rem;
    color: ${props => props.theme.colors.darkShade};

    &:focus {
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryTint}33;
    }
  }
`

export const FieldError = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.dangerShade};
`

export const SubmitButton = styled.button`
  height: 46px;
  border: none;
  border-radius: 10px;
  background: ${props => props.theme.colors.primary};
  color: #fff;
  font-weight: 600;
  font-size: 1rem;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryShade};
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
`

export const FormError = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.875rem;
  background: ${props => props.theme.colors.dangerTint}1a;
  color: ${props => props.theme.colors.dangerShade};
`
