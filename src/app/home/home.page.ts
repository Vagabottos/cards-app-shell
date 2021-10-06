import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ClipboardService } from 'ngx-clipboard';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  public cardSet = 'All';
  public language: string;
  public allSets: string[];
  public visibleCards: any[] = [];
  public faqHash = {};
  public isSearchOpen = false;
  public searchQuery = '';

  public get allLanguages() {
    return (window as any).__config.AppLanguages;
  }

  public get allCards() {
    return (window as any).__cards;
  }

  public get faqUrl() {
    return (window as any).__config.AppFAQ[this.language];
  }

  public get faqRequestUrl() {
    return (window as any).__config.AppFAQRequest[this.language];
  }

  constructor(
    private toast: ToastController,
    private translate: TranslateService,
    private clipboard: ClipboardService
  ) {}

  ngOnInit() {
    this.language = localStorage.getItem('lang');
    if (!this.language) {
      const baseLang = navigator.language || 'en-US';
      if (baseLang.split('-')[0] === 'fr') {
        this.language = 'fr-FR';
      } else {
        this.language = 'en-US';
      }
    }

    this.updateTranslate();

    this.loadSets();
    this.loadFAQ();
    this.updateCards();
  }

  public languageChange() {
    localStorage.setItem('lang', this.language);

    this.updateTranslate();
    this.loadFAQ();
  }

  private updateTranslate() {
    this.translate.use(this.language);
  }

  private cleanText(text: string): string {
    return text.split('$link:').join('').split('$').join('');
  }

  public tippyFor(entry) {
    if (!entry) { return ''; }

    return entry.map((x, i) => `
      <div class="tt ${i > 0 ? 'tippy-margin-top' : ''}">
        <div class="q">
          <p><strong>Q</strong>:</p>
          <span class="text">${this.cleanText(x.q)}</span>
        </div>
        <div class="a">
          <p><strong>A</strong>:</p>
          <span class="text">${this.cleanText(x.a)}</span>
        </div>
      </div>
    `).join('');
  }

  public updateCards() {
    this.visibleCards = this.allCards.slice();

    if (this.cardSet !== 'All') {
      this.visibleCards = this.visibleCards.filter(x => x.set.includes(this.cardSet));
    }

    if (this.searchQuery) {
      this.visibleCards = this.visibleCards.filter(x => x.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
  }

  public toggleSearch() {
    if (this.isSearchOpen) {
      this.closeSearch();
      return;
    }

    this.openSearch();
  }

  public openSearch() {
    this.isSearchOpen = true;
    this.searchQuery = '';
  }

  public closeSearch() {
    this.isSearchOpen = false;
    this.searchQuery = '';
  }

  public setSearchValue(value: string) {
    this.searchQuery = value;

    this.updateCards();
  }

  public async copyFAQ(cardName: string) {
    const faq = this.faqHash[cardName];
    if (!faq) { return; }

    let text = ``;

    faq.forEach((entry) => {
      text += `Q: ${entry.q}\nA: ${entry.a}`;
    });

    this.clipboard.copy(text);

    const toast = await this.toast.create({
      message: 'Copied FAQ to clipboard!',
      duration: 2000
    });

    toast.present();
  }

  private async loadFAQ() {
    if (!this.faqUrl) {
      this.faqHash = {};
      return;
    }

    const faq = await fetch(this.faqUrl);
    const entries = await faq.json();

    const faqHash = {};
    entries.forEach(entry => {
      faqHash[entry.card] = entry.faq;
    });

    this.faqHash = faqHash;
  }

  private loadSets() {
    const sets = new Set<string>();
    this.allCards.forEach(card => {
      card.set.forEach(set => sets.add(set));
    });

    this.allSets = [...sets].sort();
  }

}
