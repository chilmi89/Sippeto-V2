package dto_dashboard

type StatsData struct {
	Label  string `json:"label"`
	Value  string `json:"value"`
	Growth string `json:"growth"`
	Up     bool   `json:"up"`
	Type   string `json:"type"`
}

type ChartItem struct {
	Name    string  `json:"name"`
	Revenue float64 `json:"revenue"`
	Profit  float64 `json:"profit"`
}

type ActivityItem struct {
	ID     string `json:"id"`
	User   string `json:"user"`
	Action string `json:"action"`
	Time   string `json:"time"`
	Type   string `json:"type"`
}

type DashboardStatsResponse struct {
	MainStats  []StatsData    `json:"mainStats"`
	ChartData  []ChartItem    `json:"chartData"`
	Activities []ActivityItem `json:"activities"`
}
