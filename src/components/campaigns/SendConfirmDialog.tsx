'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle } from 'lucide-react'

interface SendConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientCount: number
  messageType: string
  onConfirm: () => void
  loading: boolean
}

const TYPE_LABELS: Record<string, string> = {
  SMS: '문자(SMS)',
  LMS: '장문(LMS)',
  ATA: '알림톡',
  FTA: '친구톡',
}

export default function SendConfirmDialog({
  open,
  onOpenChange,
  recipientCount,
  messageType,
  onConfirm,
  loading,
}: SendConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-gray-900">
            발송 확인
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded-lg bg-orange-50 border border-orange-100 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-orange-800">
                발송 후에는 취소할 수 없습니다.
              </p>
              <p className="text-[13px] text-orange-600 mt-1">
                내용과 수신자를 다시 한번 확인해 주세요.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-500">메시지 유형</span>
              <span className="font-medium text-gray-900">
                {TYPE_LABELS[messageType] ?? messageType}
              </span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-500">수신자 수</span>
              <span className="font-medium text-gray-900">{recipientCount}명</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-10 rounded-lg text-[14px] font-semibold border-gray-200"
            >
              취소
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `${recipientCount}명에게 발송`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
