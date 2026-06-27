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

    // Bixolon SRP-350: 80mm roll, portrait feed — short fixed height stops extra paper.
    const paperWidthMm = 80;
    const paperHeightMm = 42;
    const qrSizeMm = 26;

    const printWindow = window.open('', '_blank', `width=${paperWidthMm * 4},height=${paperHeightMm * 4}`);
    if (!printWindow) {
      this.errorMessage.set('تعذر فتح نافذة الطباعة. تحقق من إعدادات المتصفح.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>QR ${cardNumber}</title>
<style>
  @page {
    size: ${paperWidthMm}mm ${paperHeightMm}mm portrait;
    margin: 0;
  }
  html, body {
    width: ${paperWidthMm}mm;
    height: ${paperHeightMm}mm;
    max-width: ${paperWidthMm}mm;
    max-height: ${paperHeightMm}mm;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #fff;
  }
  body {
    font-family: Arial, sans-serif;
  }
  .sheet {
    width: ${paperWidthMm}mm;
    height: ${paperHeightMm}mm;
    margin: 0;
    padding: 2mm 0 0;
    text-align: center;
    overflow: hidden;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  .sheet img {
    width: ${qrSizeMm}mm;
    height: ${qrSizeMm}mm;
    display: block;
    margin: 0 auto 1mm;
  }
  .card-number {
    font-size: 8pt;
    font-weight: 700;
    line-height: 1;
    margin: 0;
    padding: 0;
  }
  @media print {
    @page {
      size: ${paperWidthMm}mm ${paperHeightMm}mm portrait;
      margin: 0;
    }
    html, body, .sheet {
      width: ${paperWidthMm}mm !important;
      height: ${paperHeightMm}mm !important;
      max-height: ${paperHeightMm}mm !important;
      overflow: hidden !important;
    }
  }
</style>
</head>
<body>
<div class="sheet">
  <img id="qr" src="${qrImage}" alt="${cardNumber}" />
  <p class="card-number">${cardNumber}</p>
</div>
<script>
  function doPrint() {
    window.focus();
    window.print();
  }
  const img = document.getElementById('qr');
  if (img.complete) {
    setTimeout(doPrint, 150);
  } else {
    img.onload = () => setTimeout(doPrint, 150);
  }
  window.onafterprint = () => window.close();
</script>
</body>
</html>`);
    printWindow.document.close();
  }
}
