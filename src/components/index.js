/**
 * HCT 디자인 시스템 — 공개 진입점.
 *
 * 개발 에이전트는 여기서 import 하세요:
 *   import { AppShell, DataTable, StatusBadge } from '@/components'
 *
 * 이 파일에 없는 것을 직접 만들어야 한다면, 먼저 AGENTS.md 의
 * "새 컴포넌트가 필요할 때" 절차를 확인하세요.
 */

/* 셸 */
export { AppShell, PageContainer, PageHeader } from './shell/AppShell'
export { Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher } from './shell/Sidebar'
export { Topbar, Breadcrumb, TopbarIconButton } from './shell/Topbar'
export { RightPanel, PropertyList, PropertyRow, PanelSection } from './shell/RightPanel'

/* 데이터 */
export { DataTable, TableToolbar, TablePagination, TableCard } from './data/DataTable'
export { StatCard, StatGrid, ChartFrame, LegendItem } from './data/StatCard'

/* 상태 */
export { EmptyState, NoResults, ErrorState } from './state/EmptyState'
export { Skeleton, SkeletonText, SkeletonTable, SkeletonStatCard } from './state/Skeleton'

/* 입력 */
export { Button, IconButton, ButtonGroup } from './input/Button'
export { TextField, SelectField, SearchInput, SearchIcon } from './input/Input'
export { FilterBar, FilterButton, SegmentedControl, DensityToggle } from './input/FilterBar'

/* 피드백 */
export { StatusBadge, Tag, Banner, WORKFLOW_STATUS } from './feedback/StatusBadge'

/* 오버레이 */
export { Modal, ConfirmDialog, Drawer } from './overlay/Modal'
export { CommandPalette, CommandPaletteTrigger } from './overlay/CommandPalette'

/* 유틸 */
export { cn } from '../lib/cn'
export { applyTheme, getStoredTheme, initTheme, isDarkActive } from '../lib/theme'
