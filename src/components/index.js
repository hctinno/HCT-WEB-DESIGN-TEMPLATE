/**
 * HCT 디자인 시스템 — 공개 진입점.
 *
 * 개발 에이전트는 여기서 import 하세요:
 *   import { AppShell, DataGrid, StatusBadge } from '@/components'
 *
 * 이 파일에 없는 것을 직접 만들어야 한다면, 먼저 AGENTS.md 의
 * "새 컴포넌트가 필요할 때" 절차를 확인하세요.
 */

/* 셸 */
export { AppShell, PageContainer, PageHeader } from './shell/AppShell'
export {
  Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher,
  WorkspaceRail, SidebarUser, Presence,
} from './shell/Sidebar'
export { Logo, LogoMark } from './shell/Logo'
export { AuthLayout, PasswordStrength } from './auth/AuthLayout'
export { Topbar, Breadcrumb, TopbarIconButton } from './shell/Topbar'
export { RightPanel, PropertyList, PropertyRow, PanelSection } from './shell/RightPanel'

/* 그리드 — 목록의 중심 */
export { DataGrid, BulkActionBar, Checkbox } from './grid/DataGrid'
export { GridCell, CellDisplay, Avatar } from './grid/GridCell'
export { GridCard, GridToolbar, GridPagination } from './grid/GridChrome'
export { ColumnSettings } from './grid/ColumnSettings'

/* 뷰 — 같은 데이터의 여러 투영 */
export { BoardView } from './view/BoardView'
export { ViewTabs, ViewSwitcher, GroupByPicker, SavedViewList, VIEW_TYPES } from './view/ViewBar'

/* 질의 */
export { QueryBar, FilterBuilder } from './query/FilterBuilder'

/* 객체 상세 */
export {
  ObjectDetail, InlineTitle, StatusTransition, ActivityFeed, CommentComposer,
} from './object/ObjectDetail'

/* 차트 */
export { LineChart, ChartLegend } from './chart/LineChart'
export { BarChart, ChartTable } from './chart/BarChart'
export { CHART_SERIES, assignSeriesColors, foldToOther, STATUS_CHART_COLOR } from './chart/chartTokens'

/* 대시보드 */
export { StatCard, StatGrid, ChartFrame, LegendItem } from './data/StatCard'
export { MatrixTable } from './data/MatrixTable'

/* 상태 */
export { EmptyState, NoResults, ErrorState } from './state/EmptyState'
export { ErrorPage } from './state/ErrorPage'
export { Skeleton, SkeletonText, SkeletonTable, SkeletonStatCard } from './state/Skeleton'

/* 입력 */
export { Button, IconButton, ButtonGroup } from './input/Button'
export { TextField, SelectField, SearchInput, SearchIcon } from './input/Input'
export { Combobox } from './input/Combobox'
export { FilterBar, FilterButton, SegmentedControl, DensityToggle } from './input/FilterBar'
export { Stepper } from './input/Stepper'
export { Dropzone } from './input/Dropzone'
export { SecretField } from './input/SecretField'

/* 폼 */
export {
  Form, FormSection, FormRow, FormActions, FormErrorSummary, SaveBar, SettingsNav, Switch, RadioCards,
} from './form/Form'
export { useForm } from '../lib/useForm'

/* 피드백 */
export { StatusBadge, Tag, Banner, WORKFLOW_STATUS } from './feedback/StatusBadge'
export { ToastProvider, useToast } from './feedback/Toast'
export { Progress, JobStatus } from './feedback/Progress'

/* 오버레이 */
export { Modal, ConfirmDialog, Drawer } from './overlay/Modal'
export { CommandPalette, CommandPaletteTrigger } from './overlay/CommandPalette'
export { ShortcutHelp } from './overlay/ShortcutHelp'

/* 데이터 모델 — 화면을 만들기 전에 여기부터 읽으세요 */
export {
  normalizeField, normalizeFields, fieldMap,
  formatValue, formatRelative, formatDate,
  OPERATORS, TYPE_OPERATORS,
} from '../lib/fields'
export {
  emptyQuery, applyQuery, groupRecords, toggleSort,
  queryToText, activeFilterChips, isQueryActive,
  addCondition, updateCondition, removeCondition,
} from '../lib/query'
export { useRecords } from '../lib/useRecords'
export { useGridKeyboard, GRID_SHORTCUTS } from '../lib/useGridKeyboard'
export { useVirtualRows } from '../lib/useVirtualRows'
export { useBottomBar } from '../lib/useBottomBar'
export { encodeQuery, decodeQuery, useQuerySync } from '../lib/queryUrl'

/* 유틸 */
export { cn } from '../lib/cn'
export {
  applyTheme, getStoredTheme, initTheme, isDarkActive,
  applyPalette, getStoredPalette, initPalette, PALETTES, DEFAULT_PALETTE,
} from '../lib/theme'
