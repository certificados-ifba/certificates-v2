import styled, { css } from 'styled-components'

interface Props {
  login: boolean
  maxWidth: number
  marginTopSm?: boolean
}

export const Container = styled.div<Props>`
  ${props =>
    props.marginTopSm &&
    css`
      @media (min-width: ${props => props.theme.responsive.smDown}) {
        margin-top: 70px;
      }
    `}
  ${props =>
    props.login &&
    css`
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 500px;
      margin: 24px 20px;
      @media (min-width: ${props => props.theme.responsive.lgDown}) {
        display: grid;
        grid-template-columns: 1fr 550px 480px 1fr;
        column-gap: 50px;
        grid-template-rows: 1fr 480px 1fr;
        grid-template-areas:
          '. . . .'
          '. logo form .'
          '. . . .';
      }
    `}
  width: 100%;
  max-width: ${props => props.maxWidth}px;
  margin: 24px 20px;

  header h2 {
    display: flex;
    button {
      margin-left: auto;
    }
    span {
      margin-left: 15px;
    }
    > svg {
      color: ${props => props.theme.colors.primary};
    }
    span,
    svg {
      margin-top: auto;
      margin-bottom: auto;
    }
    justify-content: ${props => (props.login ? 'center' : 'left')};
    font-size: 1rem;
    margin: 0;
    @media (min-width: ${props => props.theme.responsive.smDown}) {
      font-size: 1.3rem;
    }
  }
`

export const FormContainer = styled.div<{
  paddingSize?: 'lg' | 'md'
  padding: boolean
  paddingBottom?: boolean
}>`
  ${props =>
    props.paddingBottom &&
    css`
      @media (max-width: ${props => props.theme.responsive.smDown}) {
        padding-bottom: 20px;
      }
      @media (min-width: ${props => props.theme.responsive.smDown}) {
        padding-bottom: ${!props.paddingSize || props.paddingSize === 'lg'
          ? '50'
          : '30'}px;
      }
    `}
  ${props =>
    props.padding &&
    css`
      @media (max-width: ${props => props.theme.responsive.smDown}) {
        padding: 20px;
      }
      @media (min-width: ${props => props.theme.responsive.smDown}) {
        padding: ${!props.paddingSize || props.paddingSize === 'lg'
          ? '50'
          : '30'}px;
      }
    `}
`
