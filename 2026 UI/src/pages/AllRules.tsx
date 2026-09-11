import { RULE_LINKS, PS_RULES } from '../data/devices';
import { useAutomationsEXP, useAutomationsPS } from '../hooks/useAutomation';
import { useIsMobile } from '../hooks/useMediaQuery';
import RuleDetailPanel from '../components/RuleDetailPanel';
import DetailOverlay from '../components/DetailOverlay';
import { SvgIcon } from '../lib/deviceIcons';
import { formatTriggered } from '../lib/time';

interface Props {
  selectedRule: string | null;
  onSelectRule: (id: string | null) => void;
}

// Enabled/disabled state is deliberately NOT shown in this list — no status dot,
// no status pill, no Status column. Participants should judge a rule by what it
// does, not by a badge telling them whether it is currently armed. The live
// automation state is still fetched (useAutomationsEXP/PS) because the rows need
// last_triggered from it.
//
// Desktop shows Last triggered; mobile drops it to fit Name + chevron.
const GRID_DESKTOP = '1.7fr 1fr 40px';
const GRID_MOBILE = '1fr 34px';

// Section divider inside the rules card, so the physical wall switches read as a
// distinct group from the study automations rather than as more of the same.
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ padding: '14px 22px 10px', background: '#FBF9F4', borderTop: '1px solid #EFE9DD', borderBottom: '1px solid #F2EDE2' }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13.5, color: '#3A3833' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#A39E93', marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}


export default function AllRules({ selectedRule, onSelectRule }: Props) {
  const { automationsEXP: automations, loadingEXP: loading } = useAutomationsEXP();
  const { automationsPS } = useAutomationsPS();
  const isMobile = useIsMobile();
  const GRID = isMobile ? GRID_MOBILE : GRID_DESKTOP;

  return (
    <div style={{ height: isMobile ? 'auto' : 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden' }}>
      <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isMobile ? 22 : 26, color: 'var(--c-ink)', letterSpacing: '-0.02em', flexShrink: 0 }}>All Rules</h1>
      <p style={{ fontSize: 13.5, color: 'var(--c-muted)', marginTop: 4, marginBottom: 22, flexShrink: 0 }}>{RULE_LINKS.length} automations · {PS_RULES.length} physical switches</p>

      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #ECE6D9', borderRadius: 18, boxShadow: '0 10px 30px rgba(40,38,32,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: isMobile ? '14px 16px' : '15px 22px', borderBottom: '1px solid #EFE9DD', fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#A39E93', flexShrink: 0 }}>
            <span>Rule name</span>{!isMobile && <span>Last triggered</span>}<span />
          </div>

          {/* Scrollable rows */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {loading && RULE_LINKS.every(r => !automations.find(a => a.entity_id === r.ruleId)) ? (
            <div style={{ padding: '40px 22px', color: 'var(--c-muted)', fontSize: 14 }}>Loading automations…</div>
          ) : (
            <>
              <SectionHeader title="Automations" subtitle="Rules the system runs on its own." />
              {RULE_LINKS.map(r => {
              const live = automations.find(a => a.entity_id === r.ruleId);
              const isSelected = selectedRule === r.ruleId;

              return (
                <div
                  key={r.ruleId}
                  aria-label={r.name}
                  onClick={() => onSelectRule(isSelected ? null : r.ruleId)}
                  style={{
                    display: 'grid', gridTemplateColumns: GRID, padding: isMobile ? '14px 16px' : '15px 22px', cursor: 'pointer',
                    borderBottom: '1px solid #F2EDE2', transition: 'background-color .12s',
                    background: isSelected ? '#FBF4E6' : 'transparent', alignItems: 'center',
                  }}
                >
                  {/* Name */}
                  <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5, color: '#25242A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  </span>

                  {/* Last run — actual firing time from the automation's last_triggered attribute */}
                  {!isMobile && (
                    <span style={{ fontSize: 13.5, color: '#6F6A60' }}>
                      {formatTriggered(live?.attributes?.last_triggered) || r.last || ''}
                    </span>
                  )}

                  {/* Chevron */}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <SvgIcon name="chevron" size={17} color={isSelected ? '#E0992F' : '#C2BCAF'} sw={2} />
                  </span>
                </div>
              );
              })}

              <SectionHeader
                title="Physical switches"
                subtitle="Wall switches and buttons in the room. Each press fires its own rule."
              />
              {PS_RULES.map(r => {
                const live = automationsPS.find(a => a.entity_id === r.ruleId);
                const isSelected = selectedRule === r.ruleId;

                return (
                  <div
                    key={r.ruleId}
                    aria-label={r.name}
                    onClick={() => onSelectRule(isSelected ? null : r.ruleId)}
                    style={{
                      display: 'grid', gridTemplateColumns: GRID, padding: isMobile ? '14px 16px' : '15px 22px', cursor: 'pointer',
                      borderBottom: '1px solid #F2EDE2', transition: 'background-color .12s',
                      background: isSelected ? '#FBF4E6' : 'transparent', alignItems: 'center',
                    }}
                  >
                    {/* Name */}
                    <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: '#25242A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    </span>

                    {/* Last press of the physical switch (automation last_triggered) */}
                    {!isMobile && (
                      <span style={{ fontSize: 13.5, color: '#6F6A60' }}>
                        {formatTriggered(live?.attributes?.last_triggered) || 'Never'}
                      </span>
                    )}

                    {/* Chevron */}
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <SvgIcon name="chevron" size={17} color={isSelected ? '#E0992F' : '#C2BCAF'} sw={2} />
                    </span>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>

        {selectedRule && !isMobile && (
          <div style={{ maxHeight: '100%', overflowY: 'auto', flexShrink: 0 }}>
            <RuleDetailPanel ruleId={selectedRule} onClose={() => onSelectRule(null)} hideMeta />
          </div>
        )}
      </div>

      {selectedRule && isMobile && (
        <DetailOverlay onClose={() => onSelectRule(null)}>
          <RuleDetailPanel ruleId={selectedRule} onClose={() => onSelectRule(null)} hideMeta />
        </DetailOverlay>
      )}
    </div>
  );
}
