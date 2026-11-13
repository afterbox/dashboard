"use client";
import type { LinkProps } from "next/link";
import NextLink from "next/link";
import { type ForesightRegisterOptionsWithoutElement } from "js.foresight";
import { useRouter } from "next/navigation";
import { useMemo, type AnchorHTMLAttributes } from "react";
import useForesight from "@/hooks/useForesight";

interface ForesightLinkProps
    extends Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptionsWithoutElement, "callback">,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "name"> {
    children: React.ReactNode;
}

export function Link({
    children,
    hitSlop,
    name,
    meta,
    reactivateAfter,
    enabled,
    ...props
}: ForesightLinkProps) {
    const router = useRouter();
    const href = props.href.toString();
    const options = useMemo(
        () => ({
            callback: () => router.prefetch(href),
            hitSlop,
            name,
            meta,
            reactivateAfter,
            enabled,
        }),
        [router, href, hitSlop, name, meta, reactivateAfter, enabled],
    );
    const { elementRef } = useForesight<HTMLAnchorElement>(options);

    return (
        <NextLink {...props} ref={elementRef} prefetch={false}>
            {children}
        </NextLink>
    );
}
