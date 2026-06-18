package dto_report

type ReportItem struct {
	Period       string  `json:"period"`
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	NetBalance   float64 `json:"net_balance"`
}

type ReportSummary struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	NetBalance   float64 `json:"net_balance"`
}

type ReportResponse struct {
	Data    []ReportItem  `json:"data"`
	Summary ReportSummary `json:"summary"`
	Type    string        `json:"type"`
}
