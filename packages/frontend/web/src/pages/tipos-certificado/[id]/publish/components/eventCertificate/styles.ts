import styled from 'styled-components'

export const Header = styled.div`
  padding: 15px 10px;
  display: flex;
  h2 {
    margin-left: 10px;
    display: inline;
    font-size: 1.25rem;
    margin-right: auto;
    margin-top: auto;
    margin-bottom: auto;
  }
  .icon {
    margin-left: 10px;
    display: flex;
    > svg {
      margin-top: auto;
      margin-bottom: auto;
    }
  }
`

export const Container = styled.div`
  padding: 10px;
`

export const CardContainer = styled.div`
  border-radius: 10px;
  box-shadow: 0px 0px 3px 0px ${props => props.theme.colors.mediumTint};
  main {
    padding: 15px;
  }
  footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 15px 10px;
    border-top: 2px solid ${props => props.theme.colors.lightShade};
  }
`
export const Preview = styled.div`
  > div {
    display: flex;
  }
  margin-top: 15px;
  padding: 15px;
  h3 {
    text-align: center;
    margin-bottom: 5px;
  }
  box-shadow: 0px 0px 3px 0px ${props => props.theme.colors.mediumTint};
`
