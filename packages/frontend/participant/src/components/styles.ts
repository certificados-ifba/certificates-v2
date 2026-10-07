import styled, { keyframes } from 'styled-components'

export const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${props => props.theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
`

export const ContentArea = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.12);
  padding: 2rem;
  max-width: 960px;
  width: 100%;
`

/* ── Top Bar ─────────────────────────────────────────── */

export const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 12px;
`

export const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

export const LogoWrapper = styled.div`
  background: ${props => props.theme.colors.primary};
  border-radius: 10px;
  padding: 8px 14px;
  display: inline-flex;
  align-items: center;

  svg,
  img {
    height: 34px;
    width: auto;
  }
`

export const SubtitleCount = styled.p`
  font-size: 13px;
  color: #5f5e5a;
  margin-bottom: 1.5rem;
`

/* ── Buttons ─────────────────────────────────────────── */

export const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 0.5px solid ${props => props.theme.colors.primary};
  background: ${props => props.theme.colors.primary};
  color: #fff;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme.colors.primaryShade};
    border-color: ${props => props.theme.colors.primaryShade};
  }
`

export const OutlineButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 0.5px solid #b4b2a9;
  background: #fff;
  color: #1a1a18;
  transition: background 0.15s;
  white-space: nowrap;

  &:hover {
    background: #ebebea;
  }
`

export const SmallDownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  border: 0.5px solid ${props => props.theme.colors.primaryTint}80;
  background: transparent;
  transition: background 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme.colors.light};
  }
`

/* ── Filter Bar ──────────────────────────────────────── */

export const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 12px 16px;
  background: #ebebea;
  border-radius: 12px;
  border: 0.5px solid #d3d1c7;
`

export const FilterLabel = styled.label`
  font-size: 13px;
  color: #5f5e5a;
  white-space: nowrap;
`

export const FilterInput = styled.input`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 0.5px solid #b4b2a9;
  background: #fff;
  color: #1a1a18;
  flex: 1;
  min-width: 140px;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`

export const FilterSelect = styled.select`
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 0.5px solid #b4b2a9;
  background: #fff;
  color: #1a1a18;
  flex: 1;
  min-width: 130px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`

/* ── Legend ──────────────────────────────────────────── */

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5f5e5a;
  margin-bottom: 1.5rem;
`

export const LegendDot = styled.div<{ filled?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props =>
    props.filled ? props.theme.colors.primaryShade : 'transparent'};
  border: 1.5px solid
    ${props => (props.filled ? props.theme.colors.primaryShade : '#d3d1c7')};
  flex-shrink: 0;
`

export const LegendSeparator = styled.span`
  margin-left: 12px;
`

/* ── Year Section ────────────────────────────────────── */

export const YearSection = styled.div`
  margin-bottom: 2rem;
`

export const YearHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
`

export const YearBadge = styled.span`
  background: ${props => props.theme.colors.lightShade};
  color: ${props => props.theme.colors.primaryShade};
  font-size: 13px;
  font-weight: 500;
  padding: 3px 12px;
  border-radius: 20px;
  white-space: nowrap;
`

export const YearLine = styled.div`
  flex: 1;
  height: 0.5px;
  background: #d3d1c7;
`

export const YearCount = styled.span`
  font-size: 12px;
  color: #5f5e5a;
  white-space: nowrap;
`

/* ── Events Grid ─────────────────────────────────────── */

export const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
`

export const EventCard = styled.div<{ downloaded?: boolean }>`
  background: ${props => (props.downloaded ? '#f0faf5' : '#f8f8f8')};
  border: 0.5px solid ${props => (props.downloaded ? '#9FE1CB' : '#e0deda')};
  border-radius: 12px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
  position: relative;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
  }
`

export const EventCardTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  padding-right: 28px;
`

export const EventName = styled.span`
  /* Abaixo desta largura a etiqueta do tipo desce para a linha de baixo */
  flex: 1 1 140px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a18;
  line-height: 1.4;
`

export const EventTypeBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const EventCardMeta = styled.div`
  font-size: 12px;
  color: #5f5e5a;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
`

export const EventCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const CertCount = styled.span`
  font-size: 12px;
  color: #5f5e5a;

  strong {
    font-weight: 500;
    color: ${props => props.theme.colors.primary};
  }
`

export const DownloadedIndicator = styled.div<{ done?: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid
    ${props => (props.done ? props.theme.colors.primaryShade : '#d3d1c7')};
  background: ${props =>
    props.done ? props.theme.colors.primaryShade : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: border-color 0.15s, background 0.15s;
  flex-shrink: 0;
`

/* ── Popup / Modal ───────────────────────────────────── */

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
`

export const Popup = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 0.5px solid #b4b2a9;
  width: 100%;
  max-width: 580px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export const PopupHeader = styled.div`
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 0.5px solid #d3d1c7;
`

export const PopupHeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

export const PopupTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: #1a1a18;
  margin: 0;
`

export const PopupSub = styled.p`
  font-size: 13px;
  color: #5f5e5a;
  margin-top: 4px;
`

export const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0.5px solid #b4b2a9;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f5e5a;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: #ebebea;
  }
`

export const PopupBody = styled.div`
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
`

export const CertItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px solid #d3d1c7;

  &:last-child {
    border-bottom: none;
  }
`

export const CertIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.theme.colors.lightShade};
  border: 0.5px solid ${props => props.theme.colors.mediumTint};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const CertInfo = styled.div`
  flex: 1;
`

export const CertInfoName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a18;
`

export const CertInfoMeta = styled.div`
  font-size: 12px;
  color: #5f5e5a;
  margin-top: 2px;
`

export const CertDownloadedCheck = styled.div<{ done?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid
    ${props => (props.done ? props.theme.colors.primaryShade : '#d3d1c7')};
  background: ${props =>
    props.done ? props.theme.colors.primaryShade : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  pointer-events: none;
  margin-left: 4px;
  transition: all 0.15s;
`

export const PopupFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 0.5px solid #d3d1c7;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 13px;
    color: #5f5e5a;
  }
`

/* ── Empty / Loading ─────────────────────────────────── */

export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #5f5e5a;

  p {
    font-size: 14px;
    margin-top: 8px;
  }
`

export const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6rem 0;
`

/* ── User Menu ───────────────────────────────────────── */

export const UserMenuWrapper = styled.div`
  position: relative;
`

export const UserAvatarButton = styled.button<{ $active?: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid
    ${props =>
      props.$active
        ? props.theme.colors.primaryShade
        : props.theme.colors.primaryTint};
  background: ${props =>
    props.$active
      ? props.theme.colors.primaryShade
      : props.theme.colors.primary};
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
  letter-spacing: 0.5px;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme.colors.primaryShade};
    border-color: ${props => props.theme.colors.primaryShade};
  }
`

export const UserPanel = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #fff;
  border: 0.5px solid #d3d1c7;
  border-radius: 14px;
  width: 280px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
`

export const UserPanelHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 0.5px solid #d3d1c7;
`

export const UserPanelAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

export const UserPanelName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #1a1a18;
  line-height: 1.3;
`

export const UserPanelEmail = styled.div`
  font-size: 12px;
  color: #5f5e5a;
  margin-top: 2px;
  word-break: break-all;
`

export const UserPanelBody = styled.div`
  padding: 0.75rem 1.25rem;
  border-bottom: 0.5px solid #d3d1c7;
`

export const UserPanelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
`

export const UserPanelLabel = styled.span`
  font-size: 12px;
  color: #5f5e5a;
  display: flex;
  align-items: center;
  gap: 5px;
`

export const UserPanelValue = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #1a1a18;
`

export const UserPanelRowRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const EyeButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #9e9c96;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: #1a1a18;
  }
`

export const UserPanelFooter = styled.div`
  padding: 0.75rem 1.25rem;
`

export const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${props => props.theme.colors.danger};
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme.colors.dangerTint}30;
  }
`

/* ── Feedback ────────────────────────────────────────── */

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.div<{ size?: number }>`
  width: ${props => props.size || 36}px;
  height: ${props => props.size || 36}px;
  border-radius: 50%;
  border: 3px solid ${props => props.theme.colors.lightShade};
  border-top-color: ${props => props.theme.colors.primary};
  animation: ${spin} 0.8s linear infinite;
`

export const Toast = styled.div<{ kind: 'info' | 'success' | 'error' }>`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 300;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  background: ${props =>
    props.kind === 'error'
      ? props.theme.colors.dangerShade
      : props.kind === 'success'
      ? props.theme.colors.primaryShade
      : props.theme.colors.dark};

  strong {
    display: block;
    margin-bottom: 2px;
  }
`

export const BusyButtons = styled.div`
  display: inline-flex;
  gap: 6px;

  button:disabled {
    opacity: 0.55;
    cursor: progress;
  }
`
