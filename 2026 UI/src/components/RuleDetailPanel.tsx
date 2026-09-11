import { RULE_LINKS, PS_RULES } from '../data/devices';
import { useAutomationsEXP, useAutomationsPS } from '../hooks/useAutomation';
import { SvgIcon } from '../lib/deviceIcons';
import { useIsMobile } from '../hooks/useMediaQuery';
import { formatTriggered } from '../lib/time';

interface Props {
  ruleId: string;
  onClose: () => void;
  // Hide the Enabled/Disabled state badge when opened from the All Rules list,
  // where the state is already shown on the row. On the floor map it isn't
  // visible, so the card keeps it (default).
  hideMeta?: boolean;
}

export default function RuleDetailPanel({ ruleId, onClose, hideMeta }: Props) {
  const { automationsEXP: automations } = useAutomationsEXP();
  const { automationsPS } = useAutomationsPS();
  const isMobile = useIsMobile();

  // A rule is either one of the 9 study automations or one of the physical
  // switches. Both render in this card; the switch ones are reshaped to the same
  // WHEN/THEN structure (they have no conditions) and labelled as switches.
  const expRule = RULE_LINKS.find(r => r.ruleId === ruleId);
  const psRule = PS_RULES.find(r => r.ruleId === ruleId);

  const rule = expRule ?? (psRule && {
    name: psRule.name,
    enabled: true,
    last: '',
    triggers: [psRule.trigger],
    conditions: [] as string[],
    actions: [psRule.action],
    summary: psRule.summary,
  });
  const live = (psRule ? automationsPS : automations)
    .find((a: { entity_id: string; state: string; attributes?: any }) => a.entity_id === ruleId);
  if (!rule) return null;

  const kindLabel = psRule ? 'Physical switch' : 'Automation rule';
  const isEnabled = live ? live.state === 'on' : rule.enabled;
  // Actual last-fired time is the automation's `last_triggered` attribute — not
  // the logbook's newest entry, which is usually the enable/disable event.
  const lastRun = formatTriggered(live?.attributes?.last_triggered) || rule.last;

  return (
    <div style={{
      width: isMobile ? '100%' : 360, flexShrink: 0,
      background: '#FFFFFF',
      border: '1px solid #ECE6D9',
      borderRadius: isMobile ? '18px 18px 0 0' : 18,
      boxShadow: '0 10px 30px rgba(40,38,32,.10)',
      overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #F0EBDF', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, background: '#FFFFFF', border: '2px solid #E0992F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SvgIcon name="gear" size={18} color="#2A2A30" sw={1.9} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: '#9A958C', fontWeight: 600 }}>{kindLabel}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: '#25242A', lineHeight: 1.15 }}>{rule.name}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 30, height: 30, flexShrink: 0, border: 'none', background: '#F4F0E7', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <SvgIcon name="close" size={14} color="#6F6A60" sw={2} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>

        {/* Status + last run */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {!hideMeta && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: isEnabled ? '#EDF7F2' : '#F4F0E8',
              color: isEnabled ? '#2E7D52' : '#8A857A',
              border: isEnabled ? '1px solid #BDE3CE' : '1px solid #E4DDD1',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isEnabled ? '#2E7D52' : '#B8B0A4', display: 'inline-block' }} />
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
          {lastRun && <span style={{ fontSize: 12, color: '#9A958C' }}>Last triggered {lastRun}</span>}
        </div>

        {/* Triggers */}
        <div style={{ background: '#FBF1DE', border: '1px solid #F2E3C4', borderRadius: 13, padding: '13px 16px', marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#B8862E', marginBottom: 8 }}>Triggers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {rule.triggers.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: '#3A3833', lineHeight: 1.4 }}>
                <span style={{ color: '#C97E1E', fontWeight: 700, flexShrink: 0 }}>WHEN</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        {rule.conditions.length > 0 && (
          <div style={{ background: '#FBF6EC', border: '1px solid #F0E4CC', borderRadius: 13, padding: '13px 16px', marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#B8862E', marginBottom: 8 }}>Conditions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {rule.conditions.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: '#3A3833', lineHeight: 1.4 }}>
                  <span style={{ color: '#9A8348', fontWeight: 700, flexShrink: 0 }}>AND</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arrow down */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <SvgIcon name="arrowDown" size={18} color="#C9A24E" sw={1.8} />
        </div>

        {/* Actions */}
        <div style={{ background: '#E0992F', borderRadius: 13, padding: '14px 16px', marginBottom: 16, boxShadow: '0 6px 18px rgba(224,153,47,.32)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#5C3F12', marginBottom: 8 }}>Actions</div>
          {rule.actions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rule.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: '#2A2008', fontWeight: 600, lineHeight: 1.4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5C3F12', marginTop: 7, flexShrink: 0, display: 'inline-block' }} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#5C3F12', fontStyle: 'italic' }}>No actions configured yet.</div>
          )}
        </div>

        {/* Summary */}
        <div style={{ border: '1px solid #ECE6D9', borderRadius: 13, padding: '14px 16px' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93', marginBottom: 6 }}>Summary</div>
          <div style={{ fontSize: 13.5, color: '#57534B', lineHeight: 1.55 }}>{rule.summary}</div>
        </div>
      </div>
    </div>
  );
}
