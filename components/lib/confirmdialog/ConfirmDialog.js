import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { localeOption } from '../api/Api';
import { Dialog } from '../dialog/Dialog';
import { Button } from '../button/Button';
import { Portal } from '../portal/Portal';
import { ObjectUtils, classNames, IconUtils } from '../utils/Utils';
import { useUnmountEffect, useUpdateEffect } from '../hooks/Hooks';
import { OverlayService } from '../overlayservice/OverlayService';

export const confirmDialog = (props = {}) => {
    props = { ...props, ...{ visible: props.visible === undefined ? true : props.visible } };
    props.visible && OverlayService.emit('confirm-dialog', props);

    const show = (updatedProps = {}) => {
        OverlayService.emit('confirm-dialog', { ...props, ...updatedProps, ...{ visible: true } });
    }

    const hide = () => {
        OverlayService.emit('confirm-dialog', { visible: false });
    }

    return [show, hide];
}

export const ConfirmDialog = memo(forwardRef((props, ref) => {
    const [visibleState, setVisibleState] = useState(props.visible);
    const [reshowState, setReshowState] = useState(false);
    const confirmProps = useRef(null);
    const getCurrentProps = () => confirmProps.current || props;
    const getPropValue = (key) => (confirmProps.current || props)[key];
    const callbackFromProp = (key, ...param) => ObjectUtils.getPropValue(getPropValue(key), param);

    const acceptLabel = getPropValue('acceptLabel') || localeOption('accept');
    const rejectLabel = getPropValue('rejectLabel') || localeOption('reject');

    const accept = () => {
        callbackFromProp('accept');
        hide('accept');
    }

    const reject = () => {
        callbackFromProp('reject');
        hide('reject');
    }

    const show = () => {
        setVisibleState(true);
    }

    const hide = (result) => {
        setVisibleState(false);
        callbackFromProp('onHide', result);
    }

    const confirm = (updatedProps) => {
        if (updatedProps.tagKey === props.tagKey) {
            const isVisibleChanged = visibleState !== updatedProps.visible;
            const targetChanged = getPropValue('target') !== updatedProps.target;

            if (targetChanged && !props.target) {
                hide();
                confirmProps.current = updatedProps;
                setReshowState(true);
            }
            else if (isVisibleChanged) {
                confirmProps.current = updatedProps;
                updatedProps.visible ? show() : hide();
            }
        }
    }

    useEffect(() => {
        props.visible ? show() : hide();
    }, [props.visible]);

    useEffect(() => {
        if (!props.target && !props.message) {
            OverlayService.on('confirm-dialog', confirm);
        }

        return () => {
            OverlayService.off('confirm-dialog', confirm);
        }
    }, [props.target]);

    useUpdateEffect(() => {
        reshowState && show();
    }, [reshowState]);

    useUnmountEffect(() => {
        OverlayService.off('confirm-dialog', confirm);
    });

    useImperativeHandle(ref, () => ({
        confirm
    }));

    const createFooter = () => {
        const acceptClassName = classNames('p-confirm-dialog-accept', getPropValue('acceptClassName'));
        const rejectClassName = classNames('p-confirm-dialog-reject', {
            'p-button-text': !getPropValue('rejectClassName')
        }, getPropValue('rejectClassName'));
        const content = (
            <>
                <Button label={rejectLabel} icon={getPropValue('rejectIcon')} className={rejectClassName} onClick={reject} />
                <Button label={acceptLabel} icon={getPropValue('acceptIcon')} className={acceptClassName} onClick={accept} autoFocus />
            </>
        );

        if (getPropValue('footer')) {
            const defaultContentOptions = {
                accept,
                reject,
                acceptClassName,
                rejectClassName,
                acceptLabel,
                rejectLabel,
                element: content,
                props: getCurrentProps()
            };

            return ObjectUtils.getJSXElement(getPropValue('footer'), defaultContentOptions);
        }

        return content;
    }

    const createElement = () => {
        const currentProps = getCurrentProps();
        const className = classNames('p-confirm-dialog', getPropValue('className'));
        const dialogProps = ObjectUtils.findDiffKeys(currentProps, ConfirmDialog.defaultProps);
        const message = ObjectUtils.getJSXElement(getPropValue('message'), currentProps);
        const icon = IconUtils.getJSXIcon(getPropValue('icon'), { className: 'p-confirm-dialog-icon' }, { props: currentProps });
        const footer = createFooter();

        return (
            <Dialog visible={visibleState} {...dialogProps} className={className} footer={footer} onHide={hide} breakpoints={getPropValue('breakpoints')}>
                {icon}
                <span className="p-confirm-dialog-message">{message}</span>
            </Dialog>
        )
    }

    const element = createElement();

    return <Portal element={element} appendTo={getPropValue('appendTo')} />
}));

ConfirmDialog.defaultProps = {
    __TYPE: 'ConfirmDialog',
    tagKey: undefined,
    visible: false,
    message: null,
    rejectLabel: null,
    acceptLabel: null,
    icon: null,
    rejectIcon: null,
    acceptIcon: null,
    rejectClassName: null,
    acceptClassName: null,
    className: null,
    appendTo: null,
    footer: null,
    breakpoints: null,
    onHide: null,
    accept: null,
    reject: null
}
