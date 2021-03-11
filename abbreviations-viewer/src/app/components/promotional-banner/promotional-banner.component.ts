import {Component} from '@angular/core';

@Component({
  selector: 'app-promotional-banner',
  templateUrl: './promotional-banner.component.html',
  styleUrls: ['./promotional-banner.component.scss']
})
export class PromotionalBannerComponent {
  constructor() {}
  promotionalText =
      'Have you tried the Motional-Whatis slackbot? Try asking Slack <span class="code">"/whatis AV"</span>';
  dismissed = false;
}
