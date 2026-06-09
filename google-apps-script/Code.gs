/**
 * Career Compass — Google Apps Script Webhook
 *
 * デプロイ手順:
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 5. 「デプロイ」を押し、表示されたURLをコピー
 * 6. Vercel の環境変数 GOOGLE_SHEETS_WEBHOOK_URL にそのURLを設定
 * 7. /api/test-sheet にアクセスして動作確認
 */

// スプレッドシートのヘッダー行（カラム順）
var HEADERS = [
  'submitted_at',        // 送信日時 (ISO 8601)
  'grade',               // 学年
  'status',              // 就活状況
  'university',          // 大学名（現在は空）
  'faculty',             // 学部・学科（現在は空）
  'consent_research_use', // 研究利用同意 (true/false)
  // スコア
  'self_score',          // 自己理解 (0〜100)
  'social_score',        // 社会探索 (0〜100)
  'action_score',        // 行動性 (0〜100)
  'decision_score',      // 意思決定 (0〜100)
  'depth_score',         // 深度・解像度 (0〜100)
  'total_score',         // 5軸平均 (0〜100)
  // 推奨戦略
  'recommended_mode',    // 広げる/深める/動く/決める
  'recommended_axis',    // 推奨軸 (self/social/action/decision/depth)
  // 経験
  'experience_tags',     // 選択した経験タグ (カンマ区切り)
  'custom_experiences',  // その他自由入力経験 (カンマ区切り)
  // 自由記述
  'free_text_growth',    // 成長経験
  'free_text_concern',   // 引っかかっていること
  'free_text_interview', // 言語化できていない経験
  // 出力
  'generated_report_text', // AIが生成したレポート全文
  // メタデータ
  'detail_completed',    // 詳細診断まで完了したか (true/false)
  'light_answers',       // 簡易診断の回答列 (カンマ区切り)
  'detail_answers',      // 詳細診断の回答列 (カンマ区切り)
];

/**
 * POST を受け取り、スプレッドシートに1行追加する
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ヘッダー行がなければ作成
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      // ヘッダー行のスタイル
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1e293b');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // POSTデータをパース
    var data = JSON.parse(e.postData.contents);

    // ヘッダー順にデータ行を構築
    var row = HEADERS.map(function(key) {
      var val = data[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return String(val);
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET アクセス時の動作確認用レスポンス
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Career Compass Webhook is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
