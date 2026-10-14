import styled, { css } from 'styled-components'

export const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 25px 15px;

  @media (min-width: ${props => props.theme.responsive.smDown}) {
    padding: 30px;
  }
`

export const DashboardTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    flex-direction: column;
    align-items: stretch;
  }
`

export const DashboardHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const DashboardName = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${props => props.theme.colors.darkShade};
`

export const DashboardSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.mediumShade};
`

export const DashboardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    justify-content: flex-start;
  }
`

export const CardsGrid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: ${props => props.theme.responsive.lgDown}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    grid-template-columns: 1fr;
  }
`

export const DashboardCard = styled.section<{ $clickable?: boolean }>`
  background: ${props => props.theme.colors.lightTint};
  border: 1px solid ${props => props.theme.colors.lightShade};
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(21, 31, 55, 0.04);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(21, 31, 55, 0.08);
  }

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
      }

      &:focus-visible {
        outline: 2px solid ${props => props.theme.colors.primary};
        outline-offset: 2px;
      }
    `}
`

export const CardWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 110px;
  padding: 20px 22px;

  @media (max-width: ${props => props.theme.responsive.smDown}) {
    padding: 18px;
  }
`

export const MetricIcon = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  min-height: 52px;
  border-radius: 18px;
  ${({ color }) => css`
    background: ${color}18;
    color: ${color};
  `}
`

export const CardLabel = styled.h3`
  margin: 0 0 6px;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${props => props.theme.colors.darkShade};
`

export const CardValue = styled.div`
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
  color: ${props => props.theme.colors.darkShade};
  letter-spacing: -0.03em;
`

export const PeriodValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
  color: ${props => props.theme.colors.darkShade};
  letter-spacing: -0.01em;
`

export const SummaryValue = styled.div`
  margin-top: 8px;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.mediumShade};
`

export const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 24px 30px 12px;

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    flex-direction: column;
    padding: 18px 18px 12px;
  }
`

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.darkShade};
`

export const PanelDescription = styled.p`
  margin: 6px 0 0;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.mediumShade};
`

export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  white-space: nowrap;

  > span {
    font-size: 0.875rem;
    font-weight: 700;
    color: ${props => props.theme.colors.darkShade};
  }

  > div {
    min-width: 240px;
  }

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    margin-left: 0;
    width: 100%;
    flex-wrap: wrap;

    > div {
      min-width: 0;
      width: 100%;
    }
  }
`

export const AnalysisLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
  gap: 22px;
  padding: 12px 30px 28px;
  align-items: center;

  @media (max-width: ${props => props.theme.responsive.lgDown}) {
    grid-template-columns: 1fr;
  }

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    padding: 12px 18px 20px;
  }
`

export const ChartShell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
`

export const AnalysisChart = styled.svg`
  width: 100%;
  max-width: 320px;
  height: auto;
  overflow: visible;
`

export const ChartLabel = styled.text`
  fill: #ffffff;
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
  paint-order: stroke fill;
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 2px;
  pointer-events: none;
`

export const AnalysisTable = styled.div`
  min-width: 0;
`

export const TableContainer = styled.div`
  overflow: hidden;
  border-left: 1px solid transparent;

  table {
    width: 100%;
  }

  thead tr {
    height: 42px;
  }

  tbody tr:last-child {
    font-weight: 700;
  }

  tbody tr:last-child td {
    border-top: 1px solid ${props => props.theme.colors.lightShade};
    background: rgba(245, 247, 250, 0.5);
  }
`

export const TotalRow = styled.tr`
  font-weight: 700;

  td {
    border-top: 1px solid ${props => props.theme.colors.lightShade};
    background: rgba(245, 247, 250, 0.55);
  }
`

export const SummaryHeader = styled.div`
  padding: 24px 30px 10px;

  @media (max-width: ${props => props.theme.responsive.mdDown}) {
    padding: 18px 18px 10px;
  }
`

export const ActivityTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.darkShade};
`

export const ActivitySubtitle = styled.p`
  margin: 6px 0 0;
  color: ${props => props.theme.colors.mediumShade};
  font-size: 0.875rem;
`

export const LoadingContainer = styled.div`
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ColorBadge = styled.span<{ color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 8px;
  vertical-align: middle;
  flex-shrink: 0;
`

export const TableCellWithBadge = styled.div`
  display: flex;
  align-items: center;
`

export const IssuanceBadge = styled.span`
  display: inline-block;
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: rgba(61, 170, 61, 0.12);
  color: #2e7d32;
`
