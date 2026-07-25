#freshfill-coupang-panel {
  position: fixed;
  right: 22px;
  bottom: 22px;
  width: 360px;
  max-height: min(720px, calc(100vh - 44px));
  overflow: auto;
  z-index: 2147483647;
  background: #ffffff;
  color: #14181f;
  border: 1px solid #dbe2ef;
  border-radius: 24px;
  box-shadow: 0 18px 55px rgba(15, 23, 42, 0.18);
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif;
  padding: 16px;
}
#freshfill-coupang-panel * { box-sizing: border-box; }
#freshfill-coupang-panel .ff-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
#freshfill-coupang-panel .ff-head b { display: block; font-size: 18px; letter-spacing: -0.03em; }
#freshfill-coupang-panel .ff-head span { display: block; color: #64748b; font-size: 12px; margin-top: 3px; }
#freshfill-coupang-panel button {
  border: 0;
  border-radius: 14px;
  background: #1b66ff;
  color: #fff;
  font: inherit;
  font-weight: 800;
  padding: 10px 12px;
  cursor: pointer;
}
#freshfill-coupang-panel .ff-close {
  width: 34px;
  height: 34px;
  padding: 0;
  background: #eef2f7;
  color: #334155;
  font-size: 20px;
}
#freshfill-coupang-panel .ff-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}
#freshfill-coupang-panel .ff-status div {
  background: #f6f8fc;
  border: 1px solid #e5eaf3;
  border-radius: 16px;
  padding: 12px;
}
#freshfill-coupang-panel .ff-status span { display: block; color: #64748b; font-size: 11px; font-weight: 800; margin-bottom: 5px; }
#freshfill-coupang-panel .ff-status strong { font-size: 18px; letter-spacing: -0.03em; }
#freshfill-coupang-panel .ff-note {
  background: #eaf1ff;
  color: #174ea6;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
  margin-bottom: 10px;
}
#freshfill-coupang-panel .ff-list { display: grid; gap: 8px; }
#freshfill-coupang-panel .ff-card {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e5eaf3;
  background: #fff;
  border-radius: 17px;
  padding: 12px;
}
#freshfill-coupang-panel .ff-card:hover { border-color: #1b66ff; box-shadow: 0 0 0 3px rgba(27, 102, 255, 0.08); }
#freshfill-coupang-panel .ff-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1b66ff;
  color: #fff;
  font-weight: 900;
}
#freshfill-coupang-panel .ff-card b { display: block; font-size: 15px; margin-bottom: 4px; }
#freshfill-coupang-panel .ff-card small { display: block; color: #64748b; font-size: 12px; line-height: 1.4; margin-bottom: 5px; }
#freshfill-coupang-panel .ff-card em { display: block; color: #334155; font-style: normal; font-size: 12px; line-height: 1.45; }
#freshfill-coupang-panel .ff-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
#freshfill-coupang-panel .ff-disclaimer { color: #94a3b8; font-size: 11px; line-height: 1.4; margin: 10px 2px 0; }
@media (max-width: 480px) {
  #freshfill-coupang-panel { left: 10px; right: 10px; bottom: 10px; width: auto; }
}
