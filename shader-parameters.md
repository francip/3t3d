# Particle Effect Parameters

This document records the parameters used for particle effects in the 3D Tic-Tac-Toe game, specifically focusing on the Nebula Whisper style which has different configurations for the main board vs. miniboard (turn indicator and style selector).

## Nebula Whisper

### Common Parameters (Both Boards)
- **Particle Count**: 500
- **Box Size**: 0.42 (containment boundary)
- **Initial Position Z Range**: ±0.15
- **Velocity Range**: ±0.02 (was previously ±0.04)
- **Particle Size Range**: 1.0-3.0
- **Wave Amplitudes**:
  - Primary waves: 0.08 (reduced from 0.15)
  - Secondary waves: 0.04 (reduced from 0.07)
- **Type-Specific Effects**:
  - X Pattern: xFactor = 0.35 + 0.15 * sin(time), diagonal target position = 0.25
  - O Pattern: radius = 0.5 + 0.2 * sin(time)
- **Boundary Behavior**: Soft scaling (0.85) when particles hit boundary
- **Color Schema**:
  - X: Red (1.0, 0.15-0.4, 0.15-0.3)
  - O: Blue (0.15-0.3, 0.3-0.5, 1.0)

### Main Board Specific
- **Cell Size**: 0.9
- **Initial Position Radius**: 0.05-0.25
- **Initial X Pattern Cross Size**: 0.2
- **Safety Margin**: 0.65
- **Point Size Multiplier**: 18.0 (base) 
- **Effect**: More spread out, creating a full-cell cloud effect
- **Visual Impact**: Particles fill most of the cell space while staying confined

### Miniboard Specific (Turn Indicator & Style Selector)
- **Cell Size**: 0.8
- **Safety Margin**: 0.4 (more aggressively contained)
- **Point Size Multiplier**: 15.0 (reduced from main board)
- **Effect**: More tightly clustered in the center of the cell
- **Visual Impact**: Denser, more concentrated cloud effect

## Configuration Logic

### Main Board
```javascript
// Special handling for Nebula Whisper style on the main board
if (currentStyle === 'nebula-whisper') {
    configureParticleSystemForCell(particles, 0.9, 0.9, 0.42, 0.65);
}
```

### Turn Indicator & Style Preview
```javascript
// For miniboards with Nebula Whisper style
if (style.name === 'nebula-whisper' || isNebulaWhisper) {
    configureParticleSystemForCell(particles, miniCellSize, 0.9, 0.42, 0.4);
} else {
    configureParticleSystemForCell(particles, miniCellSize);
}
```

### Shader Adjustment Logic
The `configureParticleSystemForCell` function applies these adjustments:
1. Scales the entire particle system by the safety margin
2. Overrides the box size in the shader
3. Reduces point size for miniboards

## Notes
The intentional difference in appearance between main board and miniboard creates visual interest:
- Main board: More expansive, cloudy effect that fills the cell
- Miniboard: More condensed, focused presentation for the UI elements

This approach maintains the same aesthetic while providing appropriate visual scaling for different contexts.