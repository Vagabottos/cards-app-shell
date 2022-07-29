import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  public isSearchHidden = false;
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

  public get currenti18n() {
    return (window as any).__i18n[this.language];
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastController,
    private translate: TranslateService,
    private clipboard: ClipboardService
  ) {}

  ngOnInit() {
    const cardName = this.route.snapshot.queryParamMap.get('card');
    if (cardName) {
      this.searchQuery = cardName;
      this.isSearchHidden = true;
    }

    this.language = localStorage.getItem('lang');
    if (!this.language) {
      const baseLang = navigator.language || 'en-US';
      if (baseLang.split('-')[0] === 'fr') {
        this.language = 'fr-FR';
      } else if (baseLang.split('-')[0] === 'it') {
        this.language = 'it-IT';
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
    const cardsByName = this.currenti18n.Card;

    this.visibleCards = this.allCards.slice();

    if (this.cardSet !== 'All') {
      this.visibleCards = this.visibleCards.filter(x => x.set.includes(this.cardSet));
    }

    if (this.searchQuery) {
      this.visibleCards = this.visibleCards.filter(x => {
        const cardRef = cardsByName[x.name];
        if (!cardRef) { return false; }

        return cardRef.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
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

  public viewSingleCard(card: string) {
    this.searchQuery = card;
    this.router.navigate(['/'], { queryParams: { card }});
  }

  public async copyFAQ(cardName: string) {
    const faq = this.faqHash[cardName];
    if (!faq) { return; }

    let text = ``;

    faq.forEach((entry) => {
      text += `Q: ${entry.q}\nA: ${entry.a}\n`;
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
      if (!card.set) {
        console.error('no set', card);
        return;
      }

      card.set.forEach(set => sets.add(set));
    });

    this.allSets = [...sets].sort();
  }

}
