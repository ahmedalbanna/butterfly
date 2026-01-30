--
-- PostgreSQL database dump
--

\restrict O5sz6Zh3qOSaU2d4Epbki3fCmjPEYjhgyy2br6QUag0v8f4bPivVzSiHsCsvC1B

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO luxefinds_admin;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO luxefinds_admin;

--
-- Name: ChatSession; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."ChatSession" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    messages jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChatSession" OWNER TO luxefinds_admin;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    total double precision NOT NULL,
    "shippingAddress" text NOT NULL,
    "billingAddress" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerName" text NOT NULL,
    "customerPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO luxefinds_admin;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO luxefinds_admin;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    price double precision NOT NULL,
    description text NOT NULL,
    materials text NOT NULL,
    care text NOT NULL,
    image text NOT NULL,
    images text[],
    featured boolean DEFAULT false NOT NULL,
    stock integer DEFAULT 100 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO luxefinds_admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO luxefinds_admin;

--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Cart" (id, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."CartItem" (id, "cartId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChatSession; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."ChatSession" (id, "userId", "sessionId", messages, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Order" (id, "userId", status, total, "shippingAddress", "billingAddress", "customerEmail", "customerName", "customerPhone", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Product" (id, name, category, price, description, materials, care, image, images, featured, stock, "createdAt", "updatedAt") FROM stdin;
p1	Rose Gold Diamond Necklace	Jewelry	1250	A timeless piece featuring a brilliant round-cut diamond set in 18k rose gold. Elegant enough for special occasions, yet subtle for everyday luxury.	18k Rose Gold, 0.5ct Diamond (VVS1)	Clean with a soft polishing cloth. Avoid contact with perfumes and lotions.	https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxkaWFtb25kJTIwbmVja2xhY2V8ZW58MHx8fHwxNzY5NzQ5MjIyfDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxkaWFtb25kJTIwbmVja2xhY2V8ZW58MHx8fHwxNzY5NzQ5MjIyfDA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1758995116288-278d7387cbb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8amV3ZWxyeSUyMGRldGFpbHxlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux1detail/800/800}	f	100	2026-01-30 20:14:54.383	2026-01-30 20:14:54.383
p2	Minimalist Gold Hoop Earrings	Jewelry	320	Crafted for modern simplicity, these thin gold hoops are lightweight and versatile.	14k Yellow Gold	Store in a dry place. Wipe with microfiber after each use.	https://images.unsplash.com/photo-1671644730555-916aa8d8157f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxnb2xkJTIwZWFycmluZ3N8ZW58MHx8fHwxNzY5NzEwNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1671644730555-916aa8d8157f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxnb2xkJTIwZWFycmluZ3N8ZW58MHx8fHwxNzY5NzEwNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1751551683594-ab054a031696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxlYXJyaW5ncyUyMGNsb3NlfGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080}	t	100	2026-01-30 20:14:54.391	2026-01-30 20:14:54.391
p3	Classic Pearl Bracelet	Jewelry	450	Hand-selected freshwater pearls on a delicate silk cord with a rose gold clasp.	Freshwater Pearls, Rose Gold Clasp	Avoid water contact. Restring annually if worn frequently.	https://images.unsplash.com/photo-1704203355458-b36cb43eacf8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwZWFybCUyMGJyYWNlbGV0fGVufDB8fHx8MTc2OTY4NDQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1704203355458-b36cb43eacf8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwZWFybCUyMGJyYWNlbGV0fGVufDB8fHx8MTc2OTY4NDQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux3alt/800/800}	f	100	2026-01-30 20:14:54.394	2026-01-30 20:14:54.394
p4	Luxe Heritage Rose Watch	Watches	890	A masterpiece of horology. Features a sapphire crystal face and a precision Swiss movement.	Stainless Steel with Rose Gold PVD, Sapphire Crystal	Water resistant to 50m. Service every 3-5 years.	https://images.unsplash.com/photo-1548169874-53e85f753f1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsdXh1cnklMjB3YXRjaHxlbnwwfHx8fDE3Njk3MzA4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1548169874-53e85f753f1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsdXh1cnklMjB3YXRjaHxlbnwwfHx8fDE3Njk3MzA4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux4alt/800/800}	t	100	2026-01-30 20:14:54.396	2026-01-30 20:14:54.396
p5	Petite Leather Clutch	Bags	640	Handcrafted from Italian calfskin, this clutch features a minimalist design and a hidden magnetic closure.	Full-grain Italian Leather, Satin Lining	Treat with leather conditioner periodically.	https://images.unsplash.com/photo-1644308992821-6feb6375c89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsZWF0aGVyJTIwY2x1dGNofGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1644308992821-6feb6375c89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsZWF0aGVyJTIwY2x1dGNofGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux5alt/800/800}	f	100	2026-01-30 20:14:54.4	2026-01-30 20:14:54.4
p6	Tortoise Shell Frames	Accessories	210	Classic tortoise shell patterns with UV400 protection. A must-have for sunny days.	Acetate, CR-39 Lenses	Clean with provided lens spray and cloth.	https://images.unsplash.com/photo-1760446032732-c042b0d43580?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmYXNoaW9uJTIwc3VuZ2xhc3Nlc3xlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1760446032732-c042b0d43580?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmYXNoaW9uJTIwc3VuZ2xhc3Nlc3xlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux6alt/800/800}	t	100	2026-01-30 20:14:54.402	2026-01-30 20:14:54.402
p7	Botanical Silk Scarf	Accessories	180	Hand-painted floral motifs on 100% pure mulberry silk.	100% Mulberry Silk	Dry clean only.	https://images.unsplash.com/photo-1517472292914-9570a594783b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzaWxrJTIwc2NhcmZ8ZW58MHx8fHwxNzY5NzUzNDMwfDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1517472292914-9570a594783b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzaWxrJTIwc2NhcmZ8ZW58MHx8fHwxNzY5NzUzNDMwfDA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux7alt/800/800}	f	100	2026-01-30 20:14:54.404	2026-01-30 20:14:54.404
p8	Emerald Cut Ring	Jewelry	2100	A striking emerald-cut diamond ring that captures the light from every angle.	Platinum, 1.2ct Lab-Grown Diamond	Professional cleaning recommended every 6 months.	https://images.unsplash.com/photo-1719924998065-0c60e329ef58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwcmluZ3xlbnwwfHx8fDE3Njk3NzE4NjB8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1719924998065-0c60e329ef58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwcmluZ3xlbnwwfHx8fDE3Njk3NzE4NjB8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux8alt/800/800}	f	100	2026-01-30 20:14:54.408	2026-01-30 20:14:54.408
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."User" (id, email, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: ChatSession ChatSession_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ChatSession"
    ADD CONSTRAINT "ChatSession_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: CartItem_cartId_productId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON public."CartItem" USING btree ("cartId", "productId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: ChatSession_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_createdAt_idx" ON public."ChatSession" USING btree ("createdAt");


--
-- Name: ChatSession_sessionId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_sessionId_idx" ON public."ChatSession" USING btree ("sessionId");


--
-- Name: ChatSession_sessionId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON public."ChatSession" USING btree ("sessionId");


--
-- Name: ChatSession_userId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_userId_idx" ON public."ChatSession" USING btree ("userId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Product_category_idx" ON public."Product" USING btree (category);


--
-- Name: Product_featured_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Product_featured_idx" ON public."Product" USING btree (featured);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatSession ChatSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ChatSession"
    ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict O5sz6Zh3qOSaU2d4Epbki3fCmjPEYjhgyy2br6QUag0v8f4bPivVzSiHsCsvC1B

