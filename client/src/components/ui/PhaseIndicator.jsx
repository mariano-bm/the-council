import { getPhaseLabel, getPhaseClass } from '../../utils/helpers';

export default function PhaseIndicator({ phase }) {
  return (
    <span className={getPhaseClass(phase)}>
      {getPhaseLabel(phase)}
    </span>
  );
}
