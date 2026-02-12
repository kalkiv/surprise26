/**
 * SIMPLE TWEEN ENGINE (Vanilla JS replacement for GSAP)
 */
window.TWEEN = {
    _tweens: [],
    update(time) {
        let i = 0;
        while(i < this._tweens.length) {
            if(this._tweens[i].update(time)) {
                i++;
            } else {
                this._tweens.splice(i, 1);
            }
        }
    },
    to(target, props) {
        const duration = props.duration || 1;
        const delay = props.delay || 0;
        const ease = props.ease || 'linear';
        const onUpdate = props.onUpdate || null;
        const onComplete = props.onComplete || null;
        const startTime = performance.now() / 1000 + delay;
        const yoyo = props.yoyo || false;
        const repeat = props.repeat || 0;
        
        const startValues = {};
        const endValues = {};
        
        for(let key in props) {
            if(key !== 'duration' && key !== 'delay' && key !== 'ease' && key !== 'onUpdate' && key !== 'onComplete' && key !== 'yoyo' && key !== 'repeat') {
                startValues[key] = target[key];
                endValues[key] = props[key];
            }
        }

        let repeatCount = 0;
        
        const tween = {
            stopped: false,
            stop() { this.stopped = true; },
            update(now) {
                if (this.stopped) return false;
                if (now < startTime) return true;
                let progress = (now - startTime) / duration;
                
                if (progress > 1) {
                    if (repeatCount < repeat) {
                        // Very basic implementation: simply reset loop
                    }
                    progress = 1; 
                }
                
                if (progress < 0) progress = 0;

                // Simple Easing
                let eased = progress;
                if(ease === 'power2.out') eased = 1 - (1 - progress) * (1 - progress);
                if(ease === 'power2.in') eased = progress * progress;
                if(ease === 'back.in') eased = progress * progress * ((1.7 + 1) * progress - 1.7);
                if(ease === 'back.inOut') {
                    const c1 = 1.70158;
                    const c2 = c1 * 1.525;
                    eased = progress < 0.5
                      ? (Math.pow(2 * progress, 2) * ((c2 + 1) * 2 * progress - c2)) / 2
                      : (Math.pow(2 * progress - 2, 2) * ((c2 + 1) * (progress * 2 - 2) + c2) + 2) / 2;
                }
                if(ease === 'power2.inOut') {
                     eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                }
                if(ease === 'power1.in') eased = progress * progress;
                if(ease === 'power1.inOut') eased = progress < .5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

                // Elastic Out (Damped Oscillation)
                if (ease === 'elastic.out') {
                    const c4 = (2 * Math.PI) / 3;
                    eased = progress === 0 ? 0 : progress === 1 ? 1 : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
                }

                for(let key in endValues) {
                    target[key] = startValues[key] + (endValues[key] - startValues[key]) * eased;
                }

                if(onUpdate) onUpdate();

                if(progress >= 1) {
                    if(onComplete) onComplete();
                    return false; // remove
                }
                return true; // keep
            }
        };
        this._tweens.push(tween);
        return tween;
    }
};
