import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';
import { Observable } from 'rxjs';
import {
  CASHIER_TABS,
  CardDetailsResponse,
  CashierTab,
  PrintCardResponse,
} from '../../core/models/card.model';
import { CardsService } from '../../core/services/cards.service';

@Component({
  selector: 'app-cashier',
  imports: [ReactiveFormsModule],
  templateUrl: './cashier.component.html',
  styleUrl: './cashier.component.css',
})
export class CashierComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cardsService = inject(CardsService);

  protected readonly tabs = CASHIER_TABS;
  protected readonly activeTab = signal<CashierTab>('new-topup');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly printResult = signal<PrintCardResponse | null>(null);
  protected readonly cardDetails = signal<CardDetailsResponse | null>(null);
  protected readonly qrCodeUrl = signal<string | null>(null);

  protected readonly newTopupForm = this.fb.nonNullable.group({
    holderName: ['', [Validators.required, Validators.minLength(2)]],
    holderPhoneNumber: [''],
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly addFundsForm = this.fb.nonNullable.group({
    cardNumber: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly reprintForm = this.fb.nonNullable.group({
    cardNumber: [''],
    holderPhoneNumber: [''],
  });

  protected readonly lookupForm = this.fb.nonNullable.group({
    cardNumber: ['', Validators.required],
  });

  protected setTab(tab: CashierTab): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  protected clearMessages(): void {
    this.errorMessage.set(null);
    this.printResult.set(null);
    this.cardDetails.set(null);
    this.qrCodeUrl.set(null);
  }

  protected submitNewTopup(): void {
    if (this.newTopupForm.invalid) {
      this.newTopupForm.markAllAsTouched();
      this.errorMessage.set('أكمل البيانات المطلوبة: الاسم والمبلغ أكبر من صفر.');
      return;
    }

    this.runAction(() => this.cardsService.newTopup(this.newTopupForm.getRawValue()), () => {
      this.newTopupForm.reset({ holderName: '', holderPhoneNumber: '', amount: 0 });
    });
  }

  protected submitAddFunds(): void {
    if (this.addFundsForm.invalid) {
      this.addFundsForm.markAllAsTouched();
      return;
    }

    this.runAction(() => this.cardsService.addFunds(this.addFundsForm.getRawValue()), () => {
      this.addFundsForm.reset({ cardNumber: '', amount: 0 });
    });
  }

  protected submitReprint(): void {
    const raw = this.reprintForm.getRawValue();

    if (!raw.cardNumber && !raw.holderPhoneNumber) {
      this.errorMessage.set('أدخل رقم البطاقة أو رقم الهاتف.');
      return;
    }

    this.runAction(() =>
      this.cardsService.reprint({
        cardNumber: raw.cardNumber || null,
        holderPhoneNumber: raw.holderPhoneNumber || null,
      }),
    );
  }

  protected submitLookup(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.isSubmitting.set(true);

    this.cardsService.getCardDetails(this.lookupForm.controls.cardNumber.value).subscribe({
      next: (details) => {
        this.isSubmitting.set(false);
        this.cardDetails.set(details);
        this.generateQrCode(details.cardNumber);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('لم يتم العثور على البطاقة.');
      },
    });
  }

  private runAction(
    action: () => Observable<PrintCardResponse>,
    onSuccess?: () => void,
  ): void {
    this.clearMessages();
    this.isSubmitting.set(true);

    action().subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.printResult.set(result);
        this.generateQrCode(result.cardNumber);
        onSuccess?.();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('تعذر تنفيذ العملية. تحقق من البيانات.');
      },
    });
  }

  private generateQrCode(cardNumber: string): void {
    QRCode.toDataURL(cardNumber, { width: 200, margin: 1 })
      .then((url) => this.qrCodeUrl.set(url))
      .catch(() => this.qrCodeUrl.set(null));
  }

  protected printQrCode(cardNumber: string): void {
    const qrImage = this.qrCodeUrl();
    if (!qrImage) {
      this.errorMessage.set('رمز QR غير جاهز للطباعة.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=400,height=400');
    if (!printWindow) {
      this.errorMessage.set('تعذر فتح نافذة الطباعة. تحقق من إعدادات المتصفح.');
      return;
    }

    // Bixolon SRP-350 uses 80mm roll paper — fixed height stops extra paper feed.
    const labelWidthMm = 80;
    const labelHeightMm = 70;
    const qrSizeMm = 30;

    printWindow.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>QR ${cardNumber}</title>
          <style>
            @page {
              /* ضبط حجم الورقة: (8 سم عرض × 7 سم طول) لطابعة حرارية */
              size: ${labelWidthMm}mm ${labelHeightMm}mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: ${labelWidthMm}mm;
              height: ${labelHeightMm}mm;
              max-height: ${labelHeightMm}mm;
              min-height: ${labelHeightMm}mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }

            body {
              font-family: Arial, sans-serif;
            }

            .label {
              width: ${labelWidthMm}mm;
              height: ${labelHeightMm}mm;
              max-height: ${labelHeightMm}mm;
              padding: 4mm 2mm 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              gap: 2mm;
              text-align: center;
              overflow: hidden;
            }

            .label img {
              width: ${qrSizeMm}mm;
              height: ${qrSizeMm}mm;
              object-fit: contain;
              display: block;
            }

            .card-number {
              font-size: 9pt;
              font-weight: 700;
              line-height: 1.1;
              letter-spacing: 0.2px;
              word-break: break-all;
            }

            @media print {
              html,
              body,
              .label {
                width: ${labelWidthMm}mm !important;
                height: ${labelHeightMm}mm !important;
                max-height: ${labelHeightMm}mm !important;
                overflow: hidden !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${qrImage}" alt="QR ${cardNumber}" />
            <div class="card-number">${cardNumber}</div>
          </div>
          <script>
            window.onload = () => window.print();
            window.onafterprint = () => window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
