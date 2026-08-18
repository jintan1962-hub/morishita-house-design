import { getInquiries } from "@/app/actions/inquiry";
import InquiryList from "./InquiryList";

export default async function AdminInquiriesPage() {
  const res = await getInquiries();
  const inquiries = res.success ? res.data : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-ink mb-2">お問い合わせ管理</h1>
        <p className="text-sm text-reno-mute-dark">Webサイトからのお問い合わせ一覧と対応状況の管理</p>
      </div>

      <InquiryList inquiries={inquiries} />
    </div>
  );
}
