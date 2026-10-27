# FairShift — Translations Review

> **Status**: All non-English translations need native speaker review.
> Translations were authored by an AI and may contain unnatural phrasing, incorrect grammar, or culturally inappropriate terms.

## Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English | ✅ Primary — no review needed |
| `hi` | हिन्दी (Hindi) | ⚠️ Needs native review |
| `ta` | தமிழ் (Tamil) | ⚠️ Needs native review |
| `te` | తెలుగు (Telugu) | ⚠️ Needs native review |
| `kn` | ಕನ್ನಡ (Kannada) | ⚠️ Needs native review |
| `ml` | മലയാളം (Malayalam) | ⚠️ Needs native review |

## Review Guidelines

1. **Tone**: Keep it simple, plain, and friendly. Workers with limited literacy should understand the text.
2. **Consistency**: Use the same word for the same concept everywhere (e.g., "check-in", "shift", "hazard").
3. **Variables**: Do not translate or move `{{variable}}` placeholders.
4. **Technical terms**: "QR Code", "FairShift", and "₹" should remain in English/as-is.
5. **Cultural fit**: Ensure terms like "Provident Fund", "HRA" are localized correctly for Indian workers.

## How to Review

1. Open the translation file: `src/i18n/locales/{lang}.json`
2. Review each string for natural phrasing
3. Update the string directly
4. Mark this file as reviewed by changing the status above

## Priority Strings (review these first)

- Payslip explanation lines (`worker.payslip.explanation.*`) — workers rely on these to understand their pay
- Hazard reporting prompts (`worker.hazard.*`) — safety-critical
- Check-in feedback (`worker.checkin.*`, `worker.checkout.*`) — must be instantly understood
- Offline status messages (`common.offline*`) — workers need to trust the app in poor connectivity
