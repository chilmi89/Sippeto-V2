--
-- PostgreSQL database dump
--

\restrict niXFkbSeJmBTuPUc06qXSjMfWvAbRQXKmhyhA8zR8x0wmLc2OblnJ0pSfk2x6Uo

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone_number character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_qr text
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    profile_id uuid,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    price numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    branch_id uuid,
    reference_number character varying(100) NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_address text,
    payment_method character varying(50) NOT NULL,
    total_price numeric(15,2) DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    id uuid NOT NULL,
    profile_id uuid,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid NOT NULL,
    profile_id uuid,
    name character varying(100) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: product_stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_stocks (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    profile_id uuid NOT NULL,
    category_id uuid,
    name character varying(255) NOT NULL,
    description text,
    base_price numeric(15,2) DEFAULT 0 NOT NULL,
    sell_price numeric(15,2) DEFAULT 0 NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role_id uuid,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    business_name character varying(255),
    phone_number character varying(20),
    address text,
    avatar_url text,
    banner_url text,
    bio text,
    password character varying(255),
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id uuid,
    username character varying(100),
    payment_qr text
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: stock_mutations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_mutations (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    from_branch_id uuid,
    to_branch_id uuid,
    quantity integer NOT NULL,
    type character varying(50) NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: transaction_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_attachments (
    id uuid NOT NULL,
    group_id uuid,
    file_url text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: transaction_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_groups (
    id uuid NOT NULL,
    profile_id uuid,
    reference_number character varying(100),
    transaction_date date DEFAULT CURRENT_DATE,
    total_income numeric(15,2) DEFAULT 0,
    total_expense numeric(15,2) DEFAULT 0,
    net_balance numeric(15,2) DEFAULT 0,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id uuid,
    customer_name character varying(255),
    customer_phone character varying(20),
    customer_address text,
    order_status integer DEFAULT 6,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_items (
    id uuid NOT NULL,
    group_id uuid,
    category_id uuid,
    payment_method_id uuid,
    type character varying(20) NOT NULL,
    name character varying(255),
    amount numeric(15,2) DEFAULT 0,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    product_id uuid,
    quantity integer DEFAULT 1 NOT NULL
);


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, tenant_id, name, address, phone_number, is_active, created_at, updated_at, payment_qr) FROM stdin;
c3401a8c-4d8e-426b-b72e-ef9ad925c52c	c331c95c-47f7-4561-aaf6-f7e88df35095	Cabang Utama	kediri	088888888888	t	2026-05-29 23:02:56.63+07	2026-05-29 23:02:56.63+07	\N
c82e8907-1e7e-4d75-8df4-129a56985d97	e023f0ee-8cab-4e06-baf2-562533077323	Cabang Utama	Alamat Pusat		t	2026-05-29 23:02:59.053+07	2026-05-29 23:02:59.053+07	\N
58db2d27-21ad-428d-aad5-ad426b4e5d32	4d546615-7bc4-4eb8-bd37-72159fa6c6f7	Cabang Utama	Jalan Bulu Nomor 7	085536727133	t	2026-05-29 23:03:01.397+07	2026-05-29 23:03:01.397+07	\N
c3c0a49c-214e-4d89-a349-6b32d3ff921d	334a7538-ae8b-48c7-ae3e-1ac6f79cc61f	Cabang Utama	jabon 	081804252741	t	2026-05-29 23:03:03.625+07	2026-05-29 23:03:03.625+07	\N
bc7081fd-0c84-411e-8bf7-b4c1d9f947e7	e07e7a51-2999-4b7b-a650-edf4b8c91b58	Cabang Utama	Alamat Pusat		t	2026-05-29 23:03:05.879+07	2026-05-29 23:03:05.879+07	\N
6bb5381c-442e-4163-ab06-8d255c5b9059	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Cabang Utama	Tulungagung	081232756520	t	2026-05-29 23:03:08.763+07	2026-05-29 23:03:08.763+07	\N
0c8c23be-8bcb-4e94-8cae-f639a515c78b	ad68ab35-8706-4b99-8ed3-b8e5fcb1888c	Cabang Utama	Dsn. Kedung Bajul. Ds. Gemenggeng. Kec. Pace. Kab. Nganjuk	081233932843	t	2026-05-29 23:03:10.996+07	2026-05-29 23:03:10.996+07	\N
3536aa7b-9987-44ab-a90c-e1f544cbb1ee	a67a728d-543c-4045-8209-764c66fd045a	Pusat	\N	\N	t	2026-06-02 20:52:55.985+07	2026-06-02 20:52:55.985+07	\N
132f5b29-1fa2-4369-a8f9-43a913ccc9aa	a67a728d-543c-4045-8209-764c66fd045a	Munir-jaya-kediri	kediri selatan	089999888777	t	2026-06-02 22:06:54.51+07	2026-06-02 22:06:54.51+07	\N
72252a49-05fa-4c7e-94de-20dbfd981265	5caea2fd-1c13-47bd-bba4-817f370f08f3	Pusat	\N	\N	t	2026-06-02 22:07:57.38+07	2026-06-02 22:07:57.38+07	\N
0b3b55d1-060f-4e34-ab54-f1d9a98f4c2c	0f34733d-b653-43a4-914b-f96aa62bead0	Pusat	\N	\N	t	2026-06-02 22:24:32.813+07	2026-06-02 22:24:32.813+07	\N
d83a1b7b-d6d4-48d4-b77e-345a4172361e	0c518ec4-b623-4503-8639-8cd17bb63339	Cabang Utama	jalan raya mekar nomer 17 kediri selatan	083136830913	t	2026-05-29 23:02:53.889+07	2026-05-29 23:02:53.889+07	\N
23cba142-f3b8-4fc4-a486-738b77870885	0c518ec4-b623-4503-8639-8cd17bb63339	ToyoHerbalBlitar	blitar	083136830913	t	2026-05-29 23:37:26.815+07	2026-05-29 23:37:26.815+07	\N
91413933-e5b7-42fe-b084-50bc74b07a52	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Pusat	\N	\N	t	2026-06-15 14:40:05.716+07	2026-06-15 14:40:05.716+07	\N
9bdc12ad-cc27-45cb-ae03-5af92f245484	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Pusat	\N	\N	t	2026-06-15 17:55:13.445+07	2026-06-15 17:55:13.445+07	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, profile_id, name, type, created_at) FROM stdin;
941be909-57ed-4396-9a40-31b1027219d8	0c518ec4-b623-4503-8639-8cd17bb63339	Penjualan Produk	pemasukan	2026-05-06 09:46:24.596+07
ad007f69-ff74-448f-8c68-005973d9f616	0c518ec4-b623-4503-8639-8cd17bb63339	Jasa / Layanan	pemasukan	2026-05-06 09:46:25.27+07
19e456d9-f783-4652-857b-63c21a984827	0c518ec4-b623-4503-8639-8cd17bb63339	Lain-lain (Masuk)	pemasukan	2026-05-06 09:46:26.291+07
aafcdf57-efd3-495b-8a18-ede35fc574d8	0c518ec4-b623-4503-8639-8cd17bb63339	Operasional Toko	pengeluaran	2026-05-06 09:46:27.134+07
60a77edc-289c-4dd2-8d54-f6a9ddc30506	0c518ec4-b623-4503-8639-8cd17bb63339	Gaji Karyawan	pengeluaran	2026-05-06 09:46:28.013+07
56ae1c22-c526-4e51-9974-dd5061181317	0c518ec4-b623-4503-8639-8cd17bb63339	Biaya Bahan Baku	pengeluaran	2026-05-06 09:46:29.018+07
8de427b0-fd14-49b0-bdcc-f2e26b82d61e	0c518ec4-b623-4503-8639-8cd17bb63339	Lain-lain (Keluar)	pengeluaran	2026-05-06 09:46:29.937+07
0ed79e3d-5832-40ce-85cb-65a7370069b3	c331c95c-47f7-4561-aaf6-f7e88df35095	Penjualan Produk	pemasukan	2026-05-06 10:10:49.728+07
c28d6db8-be34-4755-9ee6-aa3e6bce492c	c331c95c-47f7-4561-aaf6-f7e88df35095	Jasa / Layanan	pemasukan	2026-05-06 10:10:51.053+07
deeea473-c29b-4128-a554-2c1dbddbd5f9	c331c95c-47f7-4561-aaf6-f7e88df35095	Lain-lain (Masuk)	pemasukan	2026-05-06 10:10:52.368+07
fbb168ab-89f7-400c-a1e8-72899f4a9254	c331c95c-47f7-4561-aaf6-f7e88df35095	Operasional Toko	pengeluaran	2026-05-06 10:10:53.686+07
472aa8bd-e9ce-4388-9cf9-a84a8433c96e	c331c95c-47f7-4561-aaf6-f7e88df35095	Gaji Karyawan	pengeluaran	2026-05-06 10:10:54.992+07
14e4a563-166f-4285-9d98-0e92d968ed35	c331c95c-47f7-4561-aaf6-f7e88df35095	Biaya Bahan Baku	pengeluaran	2026-05-06 10:10:56.297+07
8ec5210a-5e2a-4e0d-b8d8-f0fb14f13e97	c331c95c-47f7-4561-aaf6-f7e88df35095	Lain-lain (Keluar)	pengeluaran	2026-05-06 10:10:57.616+07
7987e702-9e32-42fa-af10-1e629360d14c	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Penjualan Produk	pemasukan	2026-05-06 10:23:15.767+07
c7d0bbc1-a133-4406-ab8f-a9cd3b8bbf53	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Jasa / Layanan	pemasukan	2026-05-06 10:23:17.223+07
2c78320e-dcfd-4984-b9a6-b333552086f5	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Lain-lain (Masuk)	pemasukan	2026-05-06 10:23:18.659+07
d7f87c4d-b4a1-41fd-a696-ef046658f3d0	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Operasional Toko	pengeluaran	2026-05-06 10:23:20.037+07
2532eeeb-080d-4c9d-9f1d-84da895e972b	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Gaji Karyawan	pengeluaran	2026-05-06 10:23:21.499+07
3acd3d88-af9d-42d8-9a38-d7fa45b8d3cb	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Biaya Bahan Baku	pengeluaran	2026-05-06 10:23:22.881+07
2cfe1477-596d-49bd-b4fc-f510db33afb5	a67a728d-543c-4045-8209-764c66fd045a	Penjualan Produk	pemasukan	2026-06-02 20:35:39.032+07
2d1b1640-a816-4a78-8520-26282b50f834	a67a728d-543c-4045-8209-764c66fd045a	Jasa / Layanan	pemasukan	2026-06-02 20:35:40.36+07
f51a0551-dab7-463e-859c-d89f37dc19f7	a67a728d-543c-4045-8209-764c66fd045a	Lain-lain (Masuk)	pemasukan	2026-06-02 20:35:41.647+07
fa093980-1d7b-48c4-be3f-303e256b2700	a67a728d-543c-4045-8209-764c66fd045a	Operasional Toko	pengeluaran	2026-06-02 20:35:43.011+07
3ee33246-46e4-45e5-bded-0bb7eab7dd4c	a67a728d-543c-4045-8209-764c66fd045a	Gaji Karyawan	pengeluaran	2026-06-02 20:35:44.303+07
5fd2652c-c89a-4d38-92ee-ee4e08c00271	a67a728d-543c-4045-8209-764c66fd045a	Biaya Bahan Baku	pengeluaran	2026-06-02 20:35:45.672+07
f9a52a1b-f49e-4624-ab96-dfdd107bd0ea	a67a728d-543c-4045-8209-764c66fd045a	Lain-lain (Keluar)	pengeluaran	2026-06-02 20:35:47.026+07
e9ad61ce-9602-41ea-872c-d270ab72065c	0c518ec4-b623-4503-8639-8cd17bb63339	Penjualan E-Catalog	INCOME	2026-06-12 00:16:57.306+07
02d3a9d1-41c2-437f-a545-8abaabd658fa	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Penjualan Produk	INCOME	2026-06-15 16:28:25.697+07
e35c5add-fcef-4bc6-b774-0655cbbeaba8	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Jasa / Layanan	INCOME	2026-06-15 16:28:25.697+07
4096548f-8da0-4ff6-93e6-3b4df2bb8329	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Lain-lain (Masuk)	INCOME	2026-06-15 16:28:25.697+07
51e4e960-f98b-4fa5-973b-514629003d39	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Operasional Toko	EXPENSE	2026-06-15 16:28:25.697+07
e92483ce-a261-495c-bd32-c36cb2fe495d	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Gaji Karyawan	EXPENSE	2026-06-15 16:28:25.697+07
06d8ca8a-8d2b-4bfa-8f96-2d6eb7bc6b1d	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Biaya Bahan Baku	EXPENSE	2026-06-15 16:28:25.697+07
383f685b-a80d-4b5d-b84d-82af206e1691	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Lain-lain (Keluar)	EXPENSE	2026-06-15 16:28:25.697+07
2f497439-e263-46f0-b849-f6b9f83aee35	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Penjualan Produk	INCOME	2026-06-15 18:13:36.761+07
49f3f942-0568-4205-8733-202c571e03ba	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Jasa / Layanan	INCOME	2026-06-15 18:13:36.761+07
cbcb07fb-ecd5-4389-980f-2de48a1baf78	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Lain-lain (Masuk)	INCOME	2026-06-15 18:13:36.761+07
babc6eaf-3768-48ef-a947-82c0aabc4467	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Operasional Toko	EXPENSE	2026-06-15 18:13:36.761+07
dfdfed92-4bd0-4b95-9086-f9f8fa1913ee	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Gaji Karyawan	EXPENSE	2026-06-15 18:13:36.761+07
31df8f01-3e50-4f0f-941f-cfafc1b25038	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Biaya Bahan Baku	EXPENSE	2026-06-15 18:13:36.761+07
29519d37-864c-4669-b56a-ee69a913c591	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Lain-lain (Keluar)	EXPENSE	2026-06-15 18:13:36.761+07
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, profile_id, branch_id, reference_number, customer_name, customer_phone, customer_address, payment_method, total_price, status, created_at, updated_at) FROM stdin;
571f31a3-6f85-4b08-8cfe-124f2060a3ab	0c518ec4-b623-4503-8639-8cd17bb63339	23cba142-f3b8-4fc4-a486-738b77870885	ORD-260611-CASA	achmad	087864455455	\N	Transfer	45000.00	SUCCESS	2026-06-12 00:03:12.154+07	2026-06-12 00:03:12.154+07
521a6f41-b07d-4126-ae3a-6bb77a3958e0	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260611-803N	achmad	087864466450	\N	COD	140000.00	CANCELLED	2026-06-12 01:29:35.823+07	2026-06-12 01:29:35.823+07
27ead9be-64fb-4e67-bb6a-525a8fc60f84	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260611-0Y6D	achmad	087666655555	\N	COD	140000.00	CANCELLED	2026-06-12 01:26:06.617+07	2026-06-12 01:26:06.617+07
ac2e7540-f0fd-4fc5-b8bf-be5f553f12e7	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260611-71ZW	achmad	087666555444	\N	COD	140000.00	CANCELLED	2026-06-12 01:40:14.192+07	2026-06-12 01:40:14.192+07
c77e175d-81b0-4596-b60b-752a32aa11a6	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260612-PNH8	Abc	085941395232	\N	COD	15000.00	SUCCESS	2026-06-12 12:47:49.508+07	2026-06-12 12:47:49.508+07
34479003-4503-423a-8c66-806453a90645	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260612-C1KO	Vgdd	58855808	\N	COD	140000.00	SUCCESS	2026-06-12 09:31:48.742+07	2026-06-12 09:31:48.742+07
85f3c334-c588-4616-9392-dd2c0dbd3c1b	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260612-98WF	budi	0855436128	\N	Transfer	15000.00	SUCCESS	2026-06-12 09:30:49.78+07	2026-06-12 09:30:49.78+07
c9b1a53e-b52f-45e2-9f9f-54a116dbe343	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260612-RZ5G	Chova Arvela	081222666333	\N	COD	15000.00	SUCCESS	2026-06-12 16:33:19.921+07	2026-06-12 16:33:19.921+07
ccf3e638-38a3-4d07-92bb-2346a4bb2a04	0c518ec4-b623-4503-8639-8cd17bb63339	d83a1b7b-d6d4-48d4-b77e-345a4172361e	ORD-260612-X9PS	khn	085	\N	COD	15000.00	SUCCESS	2026-06-12 16:59:14.979+07	2026-06-12 16:59:14.979+07
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_methods (id, profile_id, name, is_active, created_at) FROM stdin;
3e40969c-0f35-4d5d-ad83-2d78e17b765c	0c518ec4-b623-4503-8639-8cd17bb63339	Tunai / Cash	t	2026-05-06 09:46:31.971+07
16de8c7f-47c9-4192-aa31-d059b13f23fc	0c518ec4-b623-4503-8639-8cd17bb63339	Transfer Bank	t	2026-05-06 09:46:32.696+07
5257d090-becc-4466-b5ef-51f81f9b7648	0c518ec4-b623-4503-8639-8cd17bb63339	E-Wallet (OVO/Dana)	t	2026-05-06 09:46:33.628+07
81d41b8a-407a-4d87-b6e6-2ec2cbc48537	c331c95c-47f7-4561-aaf6-f7e88df35095	Tunai / Cash	t	2026-05-06 10:11:00.278+07
a80c6dae-0956-4dff-a662-2ed9fd2b0734	c331c95c-47f7-4561-aaf6-f7e88df35095	Transfer Bank	t	2026-05-06 10:11:01.585+07
18be65b7-6b06-4fb0-be28-31578808195d	c331c95c-47f7-4561-aaf6-f7e88df35095	E-Wallet (OVO/Dana)	t	2026-05-06 10:11:02.886+07
505d8ebc-6377-45f4-9bd1-9cc2351472da	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Tunai / Cash	t	2026-05-06 10:23:28.02+07
532ce905-ed4f-415c-a312-de158236dc80	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Transfer Bank	t	2026-05-06 10:23:29.465+07
bead2ca6-9ee0-4a93-ad0f-543543a667e8	468aeb21-80a0-443f-8261-6fdcb4ba50e9	E-Wallet (OVO/Dana)	t	2026-05-06 10:23:31.114+07
9f7d4e52-a269-4077-b0a9-4bfdb281eb39	a67a728d-543c-4045-8209-764c66fd045a	Tunai / Cash	t	2026-06-02 20:35:49.607+07
33faa6b9-2ebe-49db-8346-3d6aa712ac9d	a67a728d-543c-4045-8209-764c66fd045a	Transfer Bank	t	2026-06-02 20:35:50.993+07
eb4b0060-77e0-4942-ba19-3e58b6c2d61b	a67a728d-543c-4045-8209-764c66fd045a	E-Wallet (OVO/Dana)	t	2026-06-02 20:35:52.321+07
f7581eb4-4ea1-468f-a700-b93a320570da	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Tunai / Cash	t	2026-06-15 16:07:11.058+07
f510d98e-0d07-440d-8d72-ed44ff5a3dff	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Transfer Bank	t	2026-06-15 16:07:11.058+07
5d143320-4bd4-4198-98fe-34af4c6a733d	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	E-Wallet (OVO/Dana)	t	2026-06-15 16:07:11.058+07
5d4f8a9f-f1e4-4412-998a-3c8d8dfe7d92	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Tunai / Cash	t	2026-06-15 18:13:30.39+07
e5ecbce4-10fb-4ee9-b4b0-ca0f80f0b983	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Transfer Bank	t	2026-06-15 18:13:30.39+07
34606016-8848-401c-ab47-d6265126c4b5	656eca13-ba90-47d4-9bea-9e8d46dd1f30	E-Wallet (OVO/Dana)	t	2026-06-15 18:13:30.39+07
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, created_at) FROM stdin;
b3eace0e-700d-45a0-b867-7a7bf6e9384c	kelola_produk	2026-06-02 11:31:59.872+07
d6775f3b-7df4-4ce1-803f-80a189d5e549	kelola_stok	2026-06-02 11:32:01.848+07
5fada4cf-54e9-4104-9c75-dc5f6dfb08f7	kelola_cabang	2026-06-02 22:13:20.488+07
d88ff953-3cf5-415e-a4f0-0a2205f66e02	custom-jurnal-transaksi	2026-06-04 17:05:50.076+07
bd671e9e-2883-4bce-9d7b-8fc9155583f7	profile	2026-06-04 17:06:28.504+07
bc736b42-dbf4-462d-9a14-f24e11525254	management-karyawan	2026-06-04 17:06:45.246+07
08861d45-80a1-4607-8d26-43300d49f4ea	laporan-keuangan	2026-06-04 17:07:25.597+07
cab1d87b-6315-4b5e-aede-bc951d27649a	data-penjualan	2026-06-04 17:09:11.107+07
f4366f10-e808-4f70-9318-5b4be7aedd16	view dashboard packing	2026-06-16 19:48:28.098705+07
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_categories (id, profile_id, name, created_at) FROM stdin;
313d30de-26f7-4892-9c29-01fe839e4837	\N	kripik tortila	2026-06-02 11:15:50.068+07
45d3b174-e5db-4708-920f-940d4166e0af	0c518ec4-b623-4503-8639-8cd17bb63339	Makanan	2026-06-02 11:19:06.652+07
eea4c7aa-15e1-40fe-9ba1-e83002088f27	0c518ec4-b623-4503-8639-8cd17bb63339	Aksesoris	2026-06-02 11:19:06.652+07
91e6c962-1383-407b-b2db-a0e20422f2fd	0c518ec4-b623-4503-8639-8cd17bb63339	Obat & Vitamin	2026-06-02 11:19:06.652+07
300a7a1d-b772-4ff5-af5b-4ea6ae588a7d	0c518ec4-b623-4503-8639-8cd17bb63339	Jasa / Grooming	2026-06-02 11:19:06.652+07
4b9f1a4c-562d-4228-a859-13201e9fcf9f	0c518ec4-b623-4503-8639-8cd17bb63339	Lain-lain	2026-06-02 11:19:06.652+07
e9a06847-5ba9-4b91-9593-39aa55f0a71e	9202f24a-9568-45ef-96aa-f085c362a697	Makanan	2026-06-02 11:27:38.73+07
5aa6a611-fed9-442a-ac50-216e8a5b3eee	9202f24a-9568-45ef-96aa-f085c362a697	Aksesoris	2026-06-02 11:27:38.73+07
ce208126-27c1-4f7d-a6f8-3408e69b5fa6	9202f24a-9568-45ef-96aa-f085c362a697	Obat & Vitamin	2026-06-02 11:27:38.73+07
1a9b2e78-c50e-47cd-8e23-4c9fcfe0c58a	9202f24a-9568-45ef-96aa-f085c362a697	Jasa / Grooming	2026-06-02 11:27:38.73+07
1a985963-03a1-4830-b0a0-2a4f1e224bd3	9202f24a-9568-45ef-96aa-f085c362a697	Lain-lain	2026-06-02 11:27:38.73+07
43f7f593-e0e9-4af3-93a8-f49aa4f2e0d9	a67a728d-543c-4045-8209-764c66fd045a	Makanan	2026-06-02 20:11:03.914+07
b1688d0d-59f3-4273-9d6d-186e3d8f0836	a67a728d-543c-4045-8209-764c66fd045a	Aksesoris	2026-06-02 20:11:03.914+07
59f47ec2-37c1-44ed-aa10-ea35e0dcef9c	a67a728d-543c-4045-8209-764c66fd045a	Obat & Vitamin	2026-06-02 20:11:03.914+07
d7e49ac1-8f33-4e01-af0d-5329e0d13f13	a67a728d-543c-4045-8209-764c66fd045a	Jasa / Grooming	2026-06-02 20:11:03.914+07
9bd78e86-fc66-49e0-ab20-55dd895ee22f	a67a728d-543c-4045-8209-764c66fd045a	Lain-lain	2026-06-02 20:11:03.914+07
efe8d9d9-e01d-49c0-a2a1-f757f2408cb3	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Makanan	2026-06-03 10:37:56.97+07
49144062-4fbd-441b-9dc8-8db73f08c42a	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Aksesoris	2026-06-03 10:37:56.97+07
7250ceb3-5e04-48b0-a166-3b2228e67d2d	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Obat & Vitamin	2026-06-03 10:37:56.97+07
c1fdff9b-e685-40be-ace9-6f22a0c8b48e	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Jasa / Grooming	2026-06-03 10:37:56.97+07
01e2925b-093f-402b-ae87-9280b03b6207	468aeb21-80a0-443f-8261-6fdcb4ba50e9	Lain-lain	2026-06-03 10:37:56.97+07
a9e41148-b962-4d24-a2f8-25118248fe90	0f34733d-b653-43a4-914b-f96aa62bead0	Makanan	2026-06-15 15:09:30.917+07
cf0bca92-9e39-42ce-b763-0c5138cff88b	0f34733d-b653-43a4-914b-f96aa62bead0	Aksesoris	2026-06-15 15:09:30.917+07
8b88ff82-fcaf-46b5-8cdc-27c4367185eb	0f34733d-b653-43a4-914b-f96aa62bead0	Obat & Vitamin	2026-06-15 15:09:30.917+07
27a21296-42d7-4a90-9629-f2b549c3a279	0f34733d-b653-43a4-914b-f96aa62bead0	Jasa / Grooming	2026-06-15 15:09:30.917+07
b884cf24-5273-4593-8d0a-e3cce33e837a	0f34733d-b653-43a4-914b-f96aa62bead0	Lain-lain	2026-06-15 15:09:30.917+07
66c88e7e-eb2e-482d-adad-f7f5c77c3dfe	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Makanan	2026-06-15 15:13:26.128+07
60e09eac-7456-41ba-949b-151db2389875	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Aksesoris	2026-06-15 15:13:26.128+07
f12503ba-1e04-41ae-8c44-58c06547dd4c	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Obat & Vitamin	2026-06-15 15:13:26.128+07
0f742977-e8a8-4202-ae9b-21a8cc234854	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Jasa / Grooming	2026-06-15 15:13:26.128+07
0d6d95d3-0854-45de-a9c6-147eadca75bf	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Lain-lain	2026-06-15 15:13:26.128+07
018630d0-c41f-4cfa-bbb7-22c7f52192f3	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	Minuman	2026-06-15 15:15:26.318+07
5dfff25f-174e-43c3-868b-6306c1c4c19e	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Makanan	2026-06-15 18:13:21.831+07
773fbc32-e197-49b0-bfd6-004fa31be7db	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Minuman	2026-06-15 18:13:21.831+07
aaa672ae-95ba-42da-946e-1b19303dccc5	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Aksesoris	2026-06-15 18:13:21.831+07
a2f1fb5d-6f94-4e93-a3a3-2c075c589cbb	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Obat & Vitamin	2026-06-15 18:13:21.831+07
9b4d8689-b300-459c-a342-dffcafea920d	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Jasa / Grooming	2026-06-15 18:13:21.831+07
5ecdcbf8-9093-404a-a12c-e51bd70f291b	656eca13-ba90-47d4-9bea-9e8d46dd1f30	Lain-lain	2026-06-15 18:13:21.831+07
0f292ac4-3146-43ed-b7c0-f7db0f882d04	0c518ec4-b623-4503-8639-8cd17bb63339	Minuman	2026-06-15 23:09:57.314+07
\.


--
-- Data for Name: product_stocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_stocks (id, product_id, branch_id, stock, min_stock, created_at, updated_at) FROM stdin;
57ae65d6-c148-4267-927c-1511427ca0fd	5a9493a4-d61d-4f4c-8b81-3b7c5006944e	3536aa7b-9987-44ab-a90c-e1f544cbb1ee	120	10	2026-06-02 20:53:34.961+07	2026-06-02 20:53:34.961+07
a57ae7a1-b39b-4733-9658-aca92bccdd33	9e9d09e6-d10e-4355-bf62-6713e851091c	6bb5381c-442e-4163-ab06-8d255c5b9059	50	5	2026-06-04 15:52:38.316+07	2026-06-04 15:52:38.316+07
3e0cf6fb-e0e3-404b-9baf-c8a7ce297ec7	5ab59934-7723-4097-b105-08fff6ebb2c3	91413933-e5b7-42fe-b084-50bc74b07a52	1000	1	2026-06-15 18:11:52.328+07	2026-06-15 18:11:52.328+07
0bfaedad-205c-4b1c-b6fb-c07070a02eeb	de7fb3c3-4057-47ed-b6d7-3aa83d7cd774	91413933-e5b7-42fe-b084-50bc74b07a52	1000	10	2026-06-15 18:13:07.428+07	2026-06-15 18:13:07.428+07
a02c9dd0-d022-45b6-ad7c-8857ce2e7f21	8fe0c44e-e17e-4bd4-a576-7b312aefa925	91413933-e5b7-42fe-b084-50bc74b07a52	1000	1	2026-06-15 18:16:32.537+07	2026-06-15 18:16:32.537+07
9efc59a1-da49-4ac6-9e05-d59b2d50a868	4ee69c88-1c49-4388-881b-0ab9cc506f4c	91413933-e5b7-42fe-b084-50bc74b07a52	1000	1	2026-06-15 18:18:03.459+07	2026-06-15 18:18:03.459+07
e2c230c8-8227-482e-bedb-b57aa720c55e	9836322d-f284-4f9d-bf99-57003a850f26	9bdc12ad-cc27-45cb-ae03-5af92f245484	100	5	2026-06-15 18:19:33.455+07	2026-06-15 18:19:33.455+07
e99b884b-6b0f-4f2c-b1d4-db7b80363e8d	a34a01a1-2fff-4bdb-9c95-95ae04cea20a	9bdc12ad-cc27-45cb-ae03-5af92f245484	100	5	2026-06-15 18:18:21.088+07	2026-06-15 18:18:21.088+07
0d8ed3f6-98ae-4cab-858b-b34dc6af9f03	38012d62-c388-4b32-808e-561ebf123640	91413933-e5b7-42fe-b084-50bc74b07a52	1001	1	2026-06-15 15:44:52.337+07	2026-06-15 15:44:52.337+07
d2b104f5-f3ce-411c-a1bb-044ebee3767c	db2be83e-f763-47eb-a78a-729abb215b41	23cba142-f3b8-4fc4-a486-738b77870885	0	0	2026-06-17 21:23:35.833523+07	2026-06-17 21:23:35.833523+07
a545134b-928f-4fe7-95d3-5636486f08c3	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	23cba142-f3b8-4fc4-a486-738b77870885	0	0	2026-06-18 14:03:33.434038+07	2026-06-18 14:03:33.434038+07
7469150f-16fe-4986-b981-e3648d94c4c5	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	990	1	2026-06-17 20:54:27.932936+07	2026-06-17 20:54:27.932936+07
07b3cc86-2490-4fa8-bb47-8dd1740b507e	984e22b5-5a38-4b91-b233-0b5649f44f6e	91413933-e5b7-42fe-b084-50bc74b07a52	999	1	2026-06-15 18:19:02.816+07	2026-06-15 18:19:02.816+07
2a458d94-6bb0-473f-9a41-cd60e7e41bdd	15a98b09-9bd1-4d30-b278-05ce1e2180bc	91413933-e5b7-42fe-b084-50bc74b07a52	999	1	2026-06-15 16:27:53.447+07	2026-06-15 16:27:53.447+07
493b9dd9-0463-40dd-9e49-89d8b25d8d58	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	995	1	2026-06-18 14:02:39.54054+07	2026-06-18 14:02:39.54054+07
fb4da3b5-7df1-49a1-98eb-e49757feac4c	328388df-2d44-473f-9688-a2b7a7d7a4b7	d83a1b7b-d6d4-48d4-b77e-345a4172361e	999	1	2026-06-18 14:11:54.886885+07	2026-06-18 14:11:54.886885+07
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, profile_id, category_id, name, description, base_price, sell_price, image_url, is_active, created_at, updated_at, branch_id) FROM stdin;
9836322d-f284-4f9d-bf99-57003a850f26	656eca13-ba90-47d4-9bea-9e8d46dd1f30	9b4d8689-b300-459c-a342-dffcafea920d	Layanan Pembelian Makan/Minum	\N	10000.00	12000.00	\N	t	2026-06-15 18:19:32.587+07	2026-06-15 18:19:32.587+07	\N
a34a01a1-2fff-4bdb-9c95-95ae04cea20a	656eca13-ba90-47d4-9bea-9e8d46dd1f30	9b4d8689-b300-459c-a342-dffcafea920d	Layanan penumpang 	\N	10000.00	12000.00	\N	t	2026-06-15 18:18:20.298+07	2026-06-15 18:18:20.298+07	\N
c837e64f-2c1f-441e-b5eb-fcadb389cf1b	0c518ec4-b623-4503-8639-8cd17bb63339	0f292ac4-3146-43ed-b7c0-f7db0f882d04	es campur	es campur bu neny	5000.00	8000.00	http://localhost:9000/sippeto-product/product-es-campur-pt-makmur-jaya-20260618-4c32b6.jpeg	t	2026-06-18 14:02:39.54054+07	2026-06-18 14:03:33.434038+07	\N
5a9493a4-d61d-4f4c-8b81-3b7c5006944e	a67a728d-543c-4045-8209-764c66fd045a	d7e49ac1-8f33-4e01-af0d-5329e0d13f13	Kemeja	Kemeja halus lengan panjang	12000.00	15000.00	http://localhost:9000/sippeto-product/product-1780407790847-men-oversized-fit-checkered-spread-collar-casual-shirt.jpeg	t	2026-06-02 20:43:28.703+07	2026-06-02 20:43:28.703+07	\N
9e9d09e6-d10e-4355-bf62-6713e851091c	468aeb21-80a0-443f-8261-6fdcb4ba50e9	313d30de-26f7-4892-9c29-01fe839e4837	Kriptor	tortila	5000.00	7000.00	http://localhost:9000/sippeto-product/product-1780563078057-img_1261.jpeg	t	2026-06-04 15:52:37.409+07	2026-06-04 15:52:37.409+07	\N
328388df-2d44-473f-9688-a2b7a7d7a4b7	0c518ec4-b623-4503-8639-8cd17bb63339	0f292ac4-3146-43ed-b7c0-f7db0f882d04	es camput	es campur	5000.00	7000.00	http://localhost:9000/sippeto-product/product-es-camput-pt-makmur-jaya-20260618-0bd77e.jpeg	t	2026-06-18 14:11:54.886885+07	2026-06-18 14:11:54.886885+07	\N
15a98b09-9bd1-4d30-b278-05ce1e2180bc	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	Mango Milk	mango milk	7000.00	8000.00	http://localhost:9000/sippeto-product/product-1781521407863-whatsapp-image-2026-06-15-at-18.01.23.jpeg	t	2026-06-15 16:27:52.627+07	2026-06-15 16:27:52.627+07	\N
38012d62-c388-4b32-808e-561ebf123640	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	melon milk	melon mllk	4000.00	8000.00	http://localhost:9000/sippeto-product/product-1781521492542-whatsapp-image-2026-06-15-at-18.01.26.jpeg	t	2026-06-15 15:44:51.527+07	2026-06-15 15:44:51.527+07	\N
5ab59934-7723-4097-b105-08fff6ebb2c3	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	cocopandan milk	cocopandan milk	5000.00	8000.00	http://localhost:9000/sippeto-product/product-1781521818207-whatsapp-image-2026-06-15-at-18.01.30.jpeg	t	2026-06-15 18:11:51.497+07	2026-06-15 18:11:51.497+07	\N
de7fb3c3-4057-47ed-b6d7-3aa83d7cd774	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	matcha milk	matcha milk	5000.00	8000.00	http://localhost:9000/sippeto-product/product-1781521958972-whatsapp-image-2026-06-15-at-18.01.32.jpeg	t	2026-06-15 18:13:06.627+07	2026-06-15 18:13:06.627+07	\N
8fe0c44e-e17e-4bd4-a576-7b312aefa925	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	Taro milk	Taro milk	5000.00	8000.00	http://localhost:9000/sippeto-product/product-1781522025746-whatsapp-image-2026-06-15-at-18.01.34.jpeg	t	2026-06-15 18:16:31.735+07	2026-06-15 18:16:31.735+07	\N
4ee69c88-1c49-4388-881b-0ab9cc506f4c	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	Es Teh	Es Teh	2000.00	5000.00	http://localhost:9000/sippeto-product/product-1781522242527-whatsapp-image-2026-06-15-at-18.01.35.jpeg	t	2026-06-15 18:18:02.657+07	2026-06-15 18:18:02.657+07	\N
984e22b5-5a38-4b91-b233-0b5649f44f6e	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	018630d0-c41f-4cfa-bbb7-22c7f52192f3	Kopi Hitam	kopi hitam	5000.00	8000.00	http://localhost:9000/sippeto-product/product-1781522325866-whatsapp-image-2026-06-15-at-18.01.38.jpeg	t	2026-06-15 18:19:01.948+07	2026-06-15 18:19:01.948+07	\N
db2be83e-f763-47eb-a78a-729abb215b41	0c518ec4-b623-4503-8639-8cd17bb63339	0f292ac4-3146-43ed-b7c0-f7db0f882d04	es lilin	es lilin	7000.00	8000.00	http://localhost:9000/sippeto-product/product-es-lilin-pt-makmur-jaya-20260617-0499ca.png	t	2026-06-17 20:54:27.932936+07	2026-06-17 21:23:35.833523+07	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, role_id, email, full_name, business_name, phone_number, address, avatar_url, banner_url, bio, password, is_active, metadata, created_at, updated_at, branch_id, username, payment_qr) FROM stdin;
0f34733d-b653-43a4-914b-f96aa62bead0	9120f34a-0591-49f8-a041-0e8e11404774	admin@gmail.com	Super Admin SiPetto	\N	\N	\N	\N	\N	\N	$2b$10$sgIQe5Vezbxi63pyoqG2Rue4Dwt7DuoZRqAHy.D8IQKBoNpFvWESy	t	{"system": "master"}	2026-05-06 08:37:25.566+07	2026-05-06 08:37:25.566+07	\N	\N	\N
e07e7a51-2999-4b7b-a650-edf4b8c91b58	7b14cbcd-a375-4e49-a9f7-43251c00d39e	ariskasherly37@gmail.com	Ariska Test	\N		\N	\N	\N	\N	$2b$10$.K8iCS2kfDeiotzw.AVVp.Dryye9uIkxzUOxBYEhIhuYABCW9xlR.	t	{}	2026-05-06 10:21:03.56+07	2026-05-06 10:21:03.56+07	\N	ariskasherly37	\N
9202f24a-9568-45ef-96aa-f085c362a697	d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	kafabi@gmail.com	achmad kafabi	ToyoHerbalBlitar (Franchise/Cabang)	09897776655	blitar	\N	\N	\N	$2b$10$ilj2A/kZnVOD1UHbXzfdees.MFC/oxPxHkCpjbLBexAQV34jQZlgy	t	{}	2026-05-29 23:37:28.206+07	2026-05-29 23:37:28.206+07	23cba142-f3b8-4fc4-a486-738b77870885	toyoherbalblitar-franchisecabang	\N
e023f0ee-8cab-4e06-baf2-562533077323	7b14cbcd-a375-4e49-a9f7-43251c00d39e	mariawahyundaauliasari@gmail.com	Maria Wahyunda Auliasari	\N		\N	\N	\N	\N	$2b$10$aGZJ3wJkzhqgjHCJ3TTrL.w/dinGSakBz.a6b/SFqI8R/KN9fCWpy	t	{}	2026-05-06 10:20:16.188+07	2026-05-06 10:20:16.188+07	\N	mariawahyundaauliasari	\N
ad68ab35-8706-4b99-8ed3-b8e5fcb1888c	7b14cbcd-a375-4e49-a9f7-43251c00d39e	taridwirahayu@gmail.com	Sri Lestari Dwi Rahayu	F&B	081233932843	Dsn. Kedung Bajul. Ds. Gemenggeng. Kec. Pace. Kab. Nganjuk	\N	\N	\N	$2b$10$wgB7HAcDVIAPymiOfBOmHemXt3lpU7lONiLlt5YAAwd9YMItkwUeS	t	{}	2026-05-06 10:20:50.364+07	2026-05-06 10:20:50.364+07	\N	fb	\N
4d546615-7bc4-4eb8-bd37-72159fa6c6f7	7b14cbcd-a375-4e49-a9f7-43251c00d39e	julialogin01@gmail.com	Julia Dwi Larasati 	Toko Jagung	085536727133	Jalan Bulu Nomor 7	\N	\N	\N	$2b$10$AcIvFWgdqka4JIAVV0r68edNojXUcwsu62CbX4YWprzFIa1B2.kSK	t	{}	2026-05-06 10:18:15.489+07	2026-05-06 10:18:15.489+07	\N	toko-jagung	\N
334a7538-ae8b-48c7-ae3e-1ac6f79cc61f	7b14cbcd-a375-4e49-a9f7-43251c00d39e	finanrhndyni@gmail.com	Fina	cireng isi	081804252741	jabon 	\N	\N	\N	$2b$10$yJyAzOz6x1drIesYgm66iu2GVDnBp/JsgmZX0VEc4uAxzP19MiCdi	t	{}	2026-05-06 10:20:45.472+07	2026-05-06 10:20:45.472+07	\N	cireng-isi	\N
3676ab55-72ce-48b3-a64c-99bebdb512f8	7b14cbcd-a375-4e49-a9f7-43251c00d39e	sendypratama095@gmail.com	Sendy Rizki Yoga Pratama	Omah Vandel	085117396189	Jl Margo Tani, Sukorame, Mojoroto, Kota Kediri	\N	\N	\N	$2b$10$mr9/z8ouMskcpfry4xEEyOUqzqKUIdqdgvjQaL8LRF5DJnW7agiGi	t	{}	2026-06-14 11:28:51.472+07	2026-06-14 11:28:51.472+07	\N	\N	\N
5caea2fd-1c13-47bd-bba4-817f370f08f3	d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	misbah@gmail.com	munir misbah	Munir-jaya-kediri (Franchise/Cabang)	089999888777	kediri selatan	\N	\N	\N	$2b$10$prE/7r2YaxHZ9ZEpGHUXau5H5njvwKxnN8HhkNnLwzvx0PnNcSJz6	t	{}	2026-06-02 22:06:55.325+07	2026-06-02 22:06:55.325+07	132f5b29-1fa2-4369-a8f9-43a913ccc9aa	\N	\N
656eca13-ba90-47d4-9bea-9e8d46dd1f30	7b14cbcd-a375-4e49-a9f7-43251c00d39e	haloevan44@gmail.com	Evan	Jastip Evan	0895426111113	Kota Kediri Jawa Timur	http://localhost:9000/sippeto-profile/avatar-1781522175348-1000164058.png	http://localhost:9000/sippeto-profile/banner-1781522177989-1000216225.png		$2b$10$E.1xPh5zZoxkZIWpatW6GOsdyJPlqz3kXUEa8lvLw.65Tuf1LLbL6	t	{}	2026-06-15 16:49:46.372+07	2026-06-15 16:49:46.372+07	\N	\N	\N
ef72fd19-88e8-4378-92e7-e7f9f2f90c23	d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	rarafeb21@gmail.com	misbah	\N	08584360712q	desa toyoresmi	\N	\N	\N		t	{}	2026-05-06 10:23:12.942+07	2026-06-16 22:06:22.888626+07	\N	keripik-jagung	\N
0c518ec4-b623-4503-8639-8cd17bb63339	7b14cbcd-a375-4e49-a9f7-43251c00d39e	chilmi@gmail.com	chilmi	PT makmur jaya 	083136830913	jalan raya mekar nomer 17 kediri selatan	http://localhost:9000/sippeto-profile/1781696853923839049.jpeg	http://localhost:9000/sippeto-profile/1781696880531412709.png	pelaku usaha yang membangun teknologi dan ekonomi	$2b$10$qVmr6.oXQ2pNLCyoX0wOz.eJqyiUcDl6d/xaEu7krlMR1Sg16rwVm	t	{"hide_checkout_address": true}	2026-05-06 09:34:10.715+07	2026-06-17 18:48:00.575682+07	\N	pt-makmur-jaya	http://localhost:9000/sippeto-product/1781696853997055036.webp
a67a728d-543c-4045-8209-764c66fd045a	7b14cbcd-a375-4e49-a9f7-43251c00d39e	munir@gmail.com	munir	munir jaya 	0876665555444	sulawesi tenggara	http://localhost:9000/sippeto-profile/avatar-1780405793763-linux-mint-tux-sticker.jpeg	http://localhost:9000/sippeto-profile/banner-1780405795664-screenshot-from-2026-04-27-09-02-10.png	sparepart elektronik terpercaya di kendari	$2b$10$EcwJe.7hHuvYcGvzMKC70u7T0B8YxMZRWAv5nL1cJUgj2xLn7UqS6	t	{}	2026-06-02 20:05:33.974+07	2026-06-02 20:05:33.974+07	\N	munir-jaya	\N
72e40e41-44b4-4ae8-ae1f-e585d8447ab9	7b14cbcd-a375-4e49-a9f7-43251c00d39e	nenysulistyowati@gmail.com	Neny	Pondok Ketan 99	081334501169	Centra Pasar Ikan Hias Gumul , Kediri 	http://localhost:9000/sippeto-profile/avatar-1781522774641-whatsapp-image-2026-06-15-at-18.12.43.jpeg	http://localhost:9000/sippeto-profile/banner-1781522778906-whatsapp-image-2026-06-15-at-18.12.34.jpeg	cafe pondok ketan 99	$2b$10$EZjXGEQeKv87sWIJvmKQU.wZFR5OzkyYo8a3PXSzO/tS6gE1PIK.O	t	{}	2026-06-15 14:33:30.42+07	2026-06-15 14:33:30.42+07	\N	pondok-ketan-99	\N
c331c95c-47f7-4561-aaf6-f7e88df35095	7b14cbcd-a375-4e49-a9f7-43251c00d39e	khanin@gmail.com	khanin	dimsumin	088888888888	kediri	http://localhost:9000/sippeto-profile/avatar-1778037030511-esteh.jpg	http://localhost:9000/sippeto-profile/banner-1778037032605-dimsum-ori.jpg	dimusm goreng	$2b$10$lgZyVvM6Iqs8Z88njpEbLeQRHAMR.cBoOKESCGInlvWZfv9XOGPeS	t	{}	2026-05-06 10:07:58.952+07	2026-05-06 10:07:58.952+07	\N	dimsumin	\N
468aeb21-80a0-443f-8261-6fdcb4ba50e9	7b14cbcd-a375-4e49-a9f7-43251c00d39e	bagasalfin563@gmail.com	Alfin Bagas Pratama	Toko Melati	081232756520	Tulungagung	\N	\N		$2b$10$ygByg8Cp8s1s9yL6pV9u..cCOPDQO9lDBWlfIogW5j0mHQdeVuYwu	t	{}	2026-05-06 10:20:55.266+07	2026-05-06 10:20:55.266+07	\N	toko-melati	http://localhost:9000/sippeto-product/payment-qr-1780562977166-f891c33e-a796-4f85-8f6e-67ea9047cc4f.jpeg
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
9120f34a-0591-49f8-a041-0e8e11404774	b3eace0e-700d-45a0-b867-7a7bf6e9384c
9120f34a-0591-49f8-a041-0e8e11404774	d6775f3b-7df4-4ce1-803f-80a189d5e549
d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	b3eace0e-700d-45a0-b867-7a7bf6e9384c
d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	d6775f3b-7df4-4ce1-803f-80a189d5e549
7b14cbcd-a375-4e49-a9f7-43251c00d39e	b3eace0e-700d-45a0-b867-7a7bf6e9384c
7b14cbcd-a375-4e49-a9f7-43251c00d39e	d6775f3b-7df4-4ce1-803f-80a189d5e549
7b14cbcd-a375-4e49-a9f7-43251c00d39e	d88ff953-3cf5-415e-a4f0-0a2205f66e02
7b14cbcd-a375-4e49-a9f7-43251c00d39e	bc736b42-dbf4-462d-9a14-f24e11525254
7b14cbcd-a375-4e49-a9f7-43251c00d39e	08861d45-80a1-4607-8d26-43300d49f4ea
7b14cbcd-a375-4e49-a9f7-43251c00d39e	bd671e9e-2883-4bce-9d7b-8fc9155583f7
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, created_at) FROM stdin;
9120f34a-0591-49f8-a041-0e8e11404774	Admin	2026-05-06 08:36:15.071126+07
d8fcf754-dfd9-4bd8-8b40-0fa9b0a8d776	UMKM	2026-05-06 08:36:15.071126+07
7b14cbcd-a375-4e49-a9f7-43251c00d39e	owner	2026-05-06 08:36:15.071126+07
58146efc-e1a4-4a0e-b557-3ccec075f132	kurir	2026-06-16 19:38:55.672869+07
\.


--
-- Data for Name: stock_mutations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_mutations (id, product_id, from_branch_id, to_branch_id, quantity, type, notes, created_at) FROM stdin;
e29a3602-c715-4f98-bf42-50aafbb57762	5a9493a4-d61d-4f4c-8b81-3b7c5006944e	\N	3536aa7b-9987-44ab-a90c-e1f544cbb1ee	120	ADJUSTMENT	Penyesuaian alokasi stok oleh owner (Stok lama: 0, Stok baru: 120)	2026-06-02 20:53:35.467+07
211c9299-ac90-44ac-911b-7636b5ed5be5	9e9d09e6-d10e-4355-bf62-6713e851091c	\N	6bb5381c-442e-4163-ab06-8d255c5b9059	50	ADJUSTMENT	Opname stok mandiri oleh cabang (Stok lama: 0, Stok baru: 50)	2026-06-04 15:55:00.21+07
9f048216-5b01-483e-8137-7de2ef6d70aa	38012d62-c388-4b32-808e-561ebf123640	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-775958	2026-06-15 16:14:09.084+07
57a2bf3b-e03e-4b57-8c7a-8f79b7e1dd6a	38012d62-c388-4b32-808e-561ebf123640	\N	91413933-e5b7-42fe-b084-50bc74b07a52	1	ADJUSTMENT	Reversal Hapus POS - Nota #POS-775958	2026-06-15 16:14:37.594+07
de04f6ec-0b5c-4868-8fb0-3e08f47462be	38012d62-c388-4b32-808e-561ebf123640	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-374276	2026-06-15 16:40:10.619+07
0f0752c9-4a60-44d4-9ce0-e1a857684fb4	15a98b09-9bd1-4d30-b278-05ce1e2180bc	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-374276	2026-06-15 16:40:11.473+07
c38bf268-5f75-4106-8616-3e870b09ec91	38012d62-c388-4b32-808e-561ebf123640	\N	91413933-e5b7-42fe-b084-50bc74b07a52	990	ADJUSTMENT	Opname stok mandiri oleh cabang (Stok lama: 10, Stok baru: 1000)	2026-06-15 18:20:37.331+07
dbe778dd-ad26-4988-af83-8fbff8d62618	15a98b09-9bd1-4d30-b278-05ce1e2180bc	\N	91413933-e5b7-42fe-b084-50bc74b07a52	951	ADJUSTMENT	Opname stok mandiri oleh cabang (Stok lama: 49, Stok baru: 1000)	2026-06-15 18:21:33.168+07
990fe0e2-63e2-499d-9e8e-22335285e0d6	38012d62-c388-4b32-808e-561ebf123640	\N	91413933-e5b7-42fe-b084-50bc74b07a52	1	ADJUSTMENT	Reversal Hapus POS - Nota #POS-374276	2026-06-15 18:56:12.164+07
48599d9f-042f-4038-96af-a6b8e2b08758	15a98b09-9bd1-4d30-b278-05ce1e2180bc	\N	91413933-e5b7-42fe-b084-50bc74b07a52	1	ADJUSTMENT	Reversal Hapus POS - Nota #POS-374276	2026-06-15 18:56:13.022+07
1a9bd025-2d9c-4289-bf72-fccbe37d37d2	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-345393	2026-06-17 21:59:17.257575+07
b441ba81-41bf-4311-916a-447db37543fe	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-478879	2026-06-18 02:11:28.852227+07
746c9c94-705d-4e4d-afcb-f60155e7c3b5	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-044613	2026-06-18 02:37:36.529898+07
90e6d043-c2de-49bf-9cfb-8b2c87527ca2	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-880923	2026-06-18 10:21:32.406149+07
01ae07f5-e9b2-4351-94b8-3541fc32aecc	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-396352	2026-06-18 10:30:05.975858+07
91e1cd9b-5a3c-4bab-9fa9-8a049789a33a	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-655249	2026-06-18 11:57:42.704131+07
dc097e32-389c-4b5e-aaa2-1e2416e94f29	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-813205	2026-06-18 12:00:23.73827+07
86d34e8e-9dcf-457a-a719-574822111592	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-633284	2026-06-18 15:50:45.405444+07
b4ff659d-e088-42b5-ab84-68a7ab611230	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-851242	2026-06-18 16:10:58.779526+07
7a7a996d-1300-48e0-b017-57d0218b04dc	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-065235	2026-06-18 16:14:32.883564+07
caed45c1-5caf-4585-98a4-c920c23f4b08	db2be83e-f763-47eb-a78a-729abb215b41	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	3	SALE	Penjualan POS Kasir - Nota #POS-347608	2026-06-18 16:19:25.874527+07
1418aaf4-9aa9-4e5a-b0eb-4baa2ed2473a	15a98b09-9bd1-4d30-b278-05ce1e2180bc	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-587233	2026-06-18 16:23:23.033026+07
afbaf143-b52f-4569-a73f-0cf4e5ab0a50	984e22b5-5a38-4b91-b233-0b5649f44f6e	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-634742	2026-06-18 16:24:03.889363+07
e2fd3db6-da5f-4c75-8c0a-700f6a8f5f92	15a98b09-9bd1-4d30-b278-05ce1e2180bc	91413933-e5b7-42fe-b084-50bc74b07a52	\N	1	SALE	Penjualan POS Kasir - Nota #POS-644218	2026-06-18 16:24:53.995591+07
07698019-0eb7-4d7f-b8c9-3e78f6807428	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-709678	2026-06-18 16:25:16.278195+07
2dfa907f-b64d-4a8a-a911-6a88f97a5835	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-904198	2026-06-18 16:28:53.99131+07
c0df30e2-e54d-40b6-9318-3e51c2a1bd60	328388df-2d44-473f-9688-a2b7a7d7a4b7	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	1	SALE	Penjualan POS Kasir - Nota #POS-904198	2026-06-18 16:28:53.99131+07
\.


--
-- Data for Name: transaction_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaction_attachments (id, group_id, file_url, created_at) FROM stdin;
\.


--
-- Data for Name: transaction_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaction_groups (id, profile_id, reference_number, transaction_date, total_income, total_expense, net_balance, description, created_at, branch_id, customer_name, customer_phone, customer_address, order_status, updated_at) FROM stdin;
66e8ffb9-19fb-4c4a-8ff3-6041b73207ef	0c518ec4-b623-4503-8639-8cd17bb63339	POS-194756	2026-06-10	155000.00	0.00	155000.00	Transaksi POS Kasir	2026-06-10 19:40:17.012+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	khanini	\N	\N	6	2026-06-17 09:10:05.7551+07
f2174f4d-33e8-4583-85d9-00c8182622da	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260612-X9PS	2026-06-12	15000.00	0.00	15000.00	Penjualan dari E-Catalog via Order Ref: ORD-260612-X9PS	2026-06-12 17:01:58.699+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	khn	085	\N	6	2026-06-17 09:10:05.7551+07
b1615ac4-8fee-46ea-bdb3-61a08308bc55	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260611-CASA	2026-06-11	30000.00	0.00	30000.00	Penjualan dari E-Catalog via Order Ref: ORD-260611-CASA	2026-06-12 00:16:58.237+07	23cba142-f3b8-4fc4-a486-738b77870885	achmad	087864455455	\N	6	2026-06-17 09:10:05.7551+07
0544045d-86de-43a4-90ae-b9bbf14ccd56	0c518ec4-b623-4503-8639-8cd17bb63339	POS-814875	2026-06-12	140000.00	0.00	140000.00	Transaksi POS Kasir	2026-06-12 08:30:33.245+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yasa	\N	\N	6	2026-06-17 09:10:05.7551+07
c565f4e3-1f9a-4b9f-853d-fede48d86fa1	0c518ec4-b623-4503-8639-8cd17bb63339	POS-950801	2026-06-12	155000.00	0.00	155000.00	Transaksi POS Kasir	2026-06-12 08:50:06.448+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	nur	\N	\N	6	2026-06-17 09:10:05.7551+07
015f9cde-4502-4424-af0e-97c8beb9fbbd	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-734452	2026-05-06	165000.00	30000.00	135000.00		2026-05-06 09:50:41.488+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
7db0d6f6-12d8-49df-ac84-2b245a84e01f	c331c95c-47f7-4561-aaf6-f7e88df35095	TRX-047687	2026-05-06	2100000.00	20000.00	2080000.00		2026-05-06 10:12:14.117+07	c3401a8c-4d8e-426b-b72e-ef9ad925c52c	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
d18d87e4-a7a4-4696-ac19-7bfe8a790fb0	468aeb21-80a0-443f-8261-6fdcb4ba50e9	TRX-877746	2026-05-06	5000000.00	0.00	5000000.00		2026-05-06 10:25:27.419+07	6bb5381c-442e-4163-ab06-8d255c5b9059	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
ac4af239-6988-4dee-bd89-5e5e1761b65e	468aeb21-80a0-443f-8261-6fdcb4ba50e9	TRX-697794	2026-05-12	4821144.00	0.00	4821144.00		2026-05-12 14:08:56.329+07	6bb5381c-442e-4163-ab06-8d255c5b9059	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
5e52c433-8303-4f37-a14e-4aa5e83c16e2	468aeb21-80a0-443f-8261-6fdcb4ba50e9	TRX-739041	2026-05-12	0.00	389222.00	-389222.00		2026-05-12 14:09:18.628+07	6bb5381c-442e-4163-ab06-8d255c5b9059	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
c30a8c86-93f2-45c2-bcf6-1af52875ea38	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-724048	2026-05-29	150000.00	25000.00	125000.00		2026-05-30 00:19:18.825+07	23cba142-f3b8-4fc4-a486-738b77870885	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
8ccc78c1-3214-422a-a4ba-56a7b04383f9	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-782229	2026-05-29	300000.00	0.00	300000.00		2026-05-30 00:30:28.868+07	23cba142-f3b8-4fc4-a486-738b77870885	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
88d7c64e-4cba-4e32-b06c-c73b889cf2f1	0c518ec4-b623-4503-8639-8cd17bb63339	POS-235354	2026-06-12	45000.00	0.00	45000.00	Transaksi POS Kasir	2026-06-12 09:10:56.737+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	nur hamy	\N	\N	6	2026-06-17 09:10:05.7551+07
dc4567e1-63bd-49f8-88a4-a21a0d2b47c4	0c518ec4-b623-4503-8639-8cd17bb63339	POS-648521	2026-06-05	30000.00	0.00	30000.00	Transaksi POS Kasir	2026-06-05 12:01:11.561+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	chilmi	\N	\N	6	2026-06-17 09:10:05.7551+07
70a95eab-471a-40e9-8b85-65b4d88ce937	0c518ec4-b623-4503-8639-8cd17bb63339	POS-694012	2026-06-04	15000.00	0.00	15000.00	Transaksi POS Kasir	2026-06-04 18:15:48.727+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	chilmi	0878644555000	kediri	1	2026-06-17 09:10:05.7551+07
4a5238a2-24e3-41dc-a38c-56101dbd80b2	0c518ec4-b623-4503-8639-8cd17bb63339	POS-480230	2026-06-05	30000.00	0.00	30000.00	Transaksi POS Kasir	2026-06-05 13:38:36.173+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	rizky	\N	\N	6	2026-06-17 09:10:05.7551+07
9975e125-864f-4166-8f0a-d676c96bc6c2	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-558543	2026-06-09	0.00	70000.00	-70000.00		2026-06-09 23:32:39.617+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	1	2026-06-17 09:10:05.7551+07
a0ff6e4b-1888-401f-8a96-0f783d289805	0c518ec4-b623-4503-8639-8cd17bb63339	POS-656459	2026-06-12	140000.00	0.00	140000.00	Transaksi POS Kasir	2026-06-12 10:24:51.231+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuyu	\N	\N	6	2026-06-17 09:10:05.7551+07
3dccf7f4-eb81-42dd-b92d-7b777d97ff20	0c518ec4-b623-4503-8639-8cd17bb63339	POS-859282	2026-06-05	30000.00	0.00	30000.00	Transaksi POS Kasir	2026-06-05 12:04:42.62+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	husna	\N	\N	6	2026-06-17 09:10:05.7551+07
b81769dc-d5ce-4e31-9cb9-6b0e837d2cca	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-764842	2026-06-10	0.00	70000.00	-70000.00		2026-06-10 18:59:51.301+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
44845b66-18e8-487b-9260-2b7e61627b3f	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-020587	2026-06-10	0.00	70000.00	-70000.00		2026-06-10 19:06:02.413+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
a8521426-bd96-4206-bf5c-6c493bd5db38	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-181732	2026-06-10	0.00	70000.00	-70000.00		2026-06-10 19:06:49.275+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
7b16e650-c29b-42f0-bdf0-ed918bd47cc5	0c518ec4-b623-4503-8639-8cd17bb63339	POS-818898	2026-06-12	140000.00	0.00	140000.00	Transaksi POS Kasir	2026-06-12 10:27:18.472+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	bagas	\N	\N	6	2026-06-17 09:10:05.7551+07
4ff18ed3-aea8-4b92-8963-2eb3e2c288c4	0c518ec4-b623-4503-8639-8cd17bb63339	TRX-990530	2026-06-10	0.00	14000.00	-14000.00		2026-06-10 19:03:37.875+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	\N	\N	\N	6	2026-06-17 09:10:05.7551+07
c45df4dd-0376-4e0c-9609-0f3629fa91de	0c518ec4-b623-4503-8639-8cd17bb63339	POS-852183	2026-06-10	15000.00	0.00	15000.00	Transaksi POS Kasir	2026-06-10 19:17:42.779+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Pembeli Umum	\N	\N	6	2026-06-17 09:10:05.7551+07
49922388-ddd8-45e0-91f7-85fdb4dce99b	0c518ec4-b623-4503-8639-8cd17bb63339	POS-554385	2026-06-12	155000.00	0.00	155000.00	Transaksi POS Kasir	2026-06-12 17:03:09.088+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Pembeli Umum	\N	\N	6	2026-06-17 09:10:05.7551+07
8fbf749a-8658-4fc7-aea1-805be6aaf575	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260612-PNH8	2026-06-12	15000.00	0.00	15000.00	Penjualan dari E-Catalog via Order Ref: ORD-260612-PNH8	2026-06-12 12:49:38.529+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Abc	085941395232	\N	6	2026-06-17 09:10:05.7551+07
69779335-90dc-491d-94d7-1523c4294c8c	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260612-C1KO	2026-06-12	140000.00	0.00	140000.00	Penjualan dari E-Catalog via Order Ref: ORD-260612-C1KO	2026-06-12 12:53:01.925+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Vgdd	58855808	\N	6	2026-06-17 09:10:05.7551+07
1de51467-6f06-4c16-9372-59ed90fd1867	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260612-98WF	2026-06-12	15000.00	0.00	15000.00	Penjualan dari E-Catalog via Order Ref: ORD-260612-98WF	2026-06-12 12:53:15.926+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	budi	0855436128	\N	6	2026-06-17 09:10:05.7551+07
78b89cfe-1a59-473a-b79d-3c641de72e2a	0c518ec4-b623-4503-8639-8cd17bb63339	ORD-260612-RZ5G	2026-06-12	15000.00	0.00	15000.00	Penjualan dari E-Catalog via Order Ref: ORD-260612-RZ5G	2026-06-12 16:37:04.161+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Chova Arvela	081222666333	\N	6	2026-06-17 09:10:05.7551+07
05b1aebb-6ef4-4dd5-8e4e-916548b2d184	0c518ec4-b623-4503-8639-8cd17bb63339	POS-783079	2026-06-17	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-17 09:19:51.607502+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	huda	\N	\N	6	2026-06-17 09:19:51.607502+07
45f8b25f-6d65-4cae-b8d1-ae4c10691bf5	0c518ec4-b623-4503-8639-8cd17bb63339	POS-345393	2026-06-17	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-17 21:59:17.257575+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuua	\N	\N	6	2026-06-17 21:59:17.257575+07
169bbeda-9a89-40a3-ad27-fbd136b2ea87	0c518ec4-b623-4503-8639-8cd17bb63339	POS-478879	2026-06-17	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 02:11:28.852227+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuda	\N	\N	6	2026-06-18 02:11:28.852227+07
2d9cfbde-6d9d-42db-a7e1-8fd0cf3911c1	0c518ec4-b623-4503-8639-8cd17bb63339	POS-044613	2026-06-17	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 02:37:36.529898+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	jui	\N	\N	6	2026-06-18 02:37:36.529898+07
02c7eb50-3a1a-4442-a80e-6bc135bfd161	0c518ec4-b623-4503-8639-8cd17bb63339	POS-880923	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 10:21:32.406149+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuda	\N	\N	6	2026-06-18 10:21:32.406149+07
d64185d8-b857-4778-977a-7a1223b7b6dd	0c518ec4-b623-4503-8639-8cd17bb63339	POS-396352	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 10:30:05.975858+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuda	\N	\N	6	2026-06-18 10:30:05.975858+07
fffa5e6c-3836-4ec8-b0e7-6ef4ef743e5f	0c518ec4-b623-4503-8639-8cd17bb63339	POS-655249	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 11:57:42.704131+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Pembeli Umum	\N	\N	6	2026-06-18 11:57:42.704131+07
8e7d00d4-90ac-485b-ab35-189f3eebd7ab	0c518ec4-b623-4503-8639-8cd17bb63339	POS-813205	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 12:00:23.73827+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	nina	\N	\N	6	2026-06-18 12:00:23.73827+07
8755d00b-739e-435a-a50c-cb831eb77bbe	0c518ec4-b623-4503-8639-8cd17bb63339	POS-633284	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 15:50:45.405444+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	yuyu	\N	\N	6	2026-06-18 15:50:45.405444+07
82195575-00c5-4b9a-81f8-62d937364f4e	0c518ec4-b623-4503-8639-8cd17bb63339	POS-851242	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:10:58.779526+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	huhu	\N	\N	6	2026-06-18 16:10:58.779526+07
389be0a0-09af-4f48-b06d-24adfc5dec0e	0c518ec4-b623-4503-8639-8cd17bb63339	POS-065235	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:14:32.883564+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	y	\N	\N	6	2026-06-18 16:14:32.883564+07
b1a9e75a-4dd5-45d1-9d48-2859fef2dcec	0c518ec4-b623-4503-8639-8cd17bb63339	POS-347608	2026-06-18	24000.00	0.00	24000.00	Transaksi POS Kasir	2026-06-18 16:19:25.874527+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	Khn	\N	\N	6	2026-06-18 16:19:25.874527+07
17d5302c-1fe9-4f21-ac63-54cd6f3d9b6c	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	POS-587233	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:23:23.033026+07	91413933-e5b7-42fe-b084-50bc74b07a52	Pembeli Umum	\N	\N	6	2026-06-18 16:23:23.033026+07
46c6f457-86aa-4f55-b771-a46199ad5a92	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	POS-634742	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:24:03.889363+07	91413933-e5b7-42fe-b084-50bc74b07a52	Pembeli Umum	\N	\N	6	2026-06-18 16:24:03.889363+07
f2ad3376-8dac-45af-b8cd-7d20c9c8ad9c	72e40e41-44b4-4ae8-ae1f-e585d8447ab9	POS-644218	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:24:53.995591+07	91413933-e5b7-42fe-b084-50bc74b07a52	Pembeli Umum	\N	\N	6	2026-06-18 16:24:53.995591+07
29454c61-4e9f-46fa-b97f-6b2b5401b7b4	0c518ec4-b623-4503-8639-8cd17bb63339	POS-709678	2026-06-18	8000.00	0.00	8000.00	Transaksi POS Kasir	2026-06-18 16:25:16.278195+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	j	\N	\N	6	2026-06-18 16:25:16.278195+07
0ebf1e98-47f5-4cf0-aabb-8072ab277ab4	0c518ec4-b623-4503-8639-8cd17bb63339	POS-904198	2026-06-18	15000.00	0.00	15000.00	Transaksi POS Kasir	2026-06-18 16:28:53.99131+07	d83a1b7b-d6d4-48d4-b77e-345a4172361e	y	\N	\N	6	2026-06-18 16:28:53.99131+07
\.


--
-- Data for Name: transaction_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaction_items (id, group_id, category_id, payment_method_id, type, name, amount, created_at, product_id, quantity) FROM stdin;
8f1b0968-aa7d-4668-9f9d-0e4fc80662e2	015f9cde-4502-4424-af0e-97c8beb9fbbd	941be909-57ed-4396-9a40-31b1027219d8	5257d090-becc-4466-b5ef-51f81f9b7648	INCOME	pendapatan	65000.00	2026-05-06 09:50:41.488+07	\N	1
f2c1d939-545e-42d8-84d7-a93f265c3268	015f9cde-4502-4424-af0e-97c8beb9fbbd	941be909-57ed-4396-9a40-31b1027219d8	5257d090-becc-4466-b5ef-51f81f9b7648	INCOME	pendapatan	100000.00	2026-05-06 09:50:41.488+07	\N	1
8b9c1d02-4620-4cab-912b-36ea391d8e3f	015f9cde-4502-4424-af0e-97c8beb9fbbd	56ae1c22-c526-4e51-9974-dd5061181317	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	pengeluaran	30000.00	2026-05-06 09:50:41.488+07	\N	1
2cc5bd0d-82d2-4428-b168-c2afed7921b8	7db0d6f6-12d8-49df-ac84-2b245a84e01f	0ed79e3d-5832-40ce-85cb-65a7370069b3	81d41b8a-407a-4d87-b6e6-2ec2cbc48537	INCOME	pemasukan	100000.00	2026-05-06 10:12:14.117+07	\N	1
a1da4b04-03ba-4520-be99-cad32a46395d	7db0d6f6-12d8-49df-ac84-2b245a84e01f	deeea473-c29b-4128-a554-2c1dbddbd5f9	a80c6dae-0956-4dff-a662-2ed9fd2b0734	INCOME	pemasukan	2000000.00	2026-05-06 10:12:14.117+07	\N	1
f5409760-ab7f-4073-bbeb-e6664d1e0bdb	7db0d6f6-12d8-49df-ac84-2b245a84e01f	fbb168ab-89f7-400c-a1e8-72899f4a9254	18be65b7-6b06-4fb0-be28-31578808195d	EXPENSE	transport	20000.00	2026-05-06 10:12:14.117+07	\N	1
92a5ad06-8bf2-40e6-a270-ea1eb3e07647	d18d87e4-a7a4-4696-ac19-7bfe8a790fb0	7987e702-9e32-42fa-af10-1e629360d14c	505d8ebc-6377-45f4-9bd1-9cc2351472da	INCOME	Penjualan Arak Bali	5000000.00	2026-05-06 10:25:27.419+07	\N	1
087438d4-1233-4e13-97e0-5f7cab96cce5	ac4af239-6988-4dee-bd89-5e5e1761b65e	7987e702-9e32-42fa-af10-1e629360d14c	532ce905-ed4f-415c-a312-de158236dc80	INCOME	333333	2478922.00	2026-05-12 14:08:56.329+07	\N	1
9d37ce4a-c3c1-4863-a8e7-dac3ea2f0299	ac4af239-6988-4dee-bd89-5e5e1761b65e	7987e702-9e32-42fa-af10-1e629360d14c	532ce905-ed4f-415c-a312-de158236dc80	INCOME	33333	2342222.00	2026-05-12 14:08:56.329+07	\N	1
9f02a25c-d594-4f66-95f4-2c24ef0d43b4	5e52c433-8303-4f37-a14e-4aa5e83c16e2	3acd3d88-af9d-42d8-9a38-d7fa45b8d3cb	bead2ca6-9ee0-4a93-ad0f-543543a667e8	EXPENSE	a	32222.00	2026-05-12 14:09:18.628+07	\N	1
a9c15553-910b-4259-a032-5df94fdaee0e	5e52c433-8303-4f37-a14e-4aa5e83c16e2	3acd3d88-af9d-42d8-9a38-d7fa45b8d3cb	bead2ca6-9ee0-4a93-ad0f-543543a667e8	EXPENSE	b	357000.00	2026-05-12 14:09:18.628+07	\N	1
ffbe5ba9-7940-476f-abf4-f2f10413f24a	c30a8c86-93f2-45c2-bcf6-1af52875ea38	941be909-57ed-4396-9a40-31b1027219d8	5257d090-becc-4466-b5ef-51f81f9b7648	INCOME	penjualan produk	150000.00	2026-05-30 00:19:18.825+07	\N	1
b3cc26bf-ce00-4e93-b0bd-9c72efa4798d	c30a8c86-93f2-45c2-bcf6-1af52875ea38	aafcdf57-efd3-495b-8a18-ede35fc574d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	operasional	25000.00	2026-05-30 00:19:18.825+07	\N	1
6ccd7538-0138-493c-a57e-19962ac8bad7	8ccc78c1-3214-422a-a4ba-56a7b04383f9	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	pemasukan	300000.00	2026-05-30 00:30:28.868+07	\N	1
be093484-9240-40c1-a408-a89b7a766f1b	9975e125-864f-4166-8f0a-d676c96bc6c2	60a77edc-289c-4dd2-8d54-f6a9ddc30506	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	pengeluaran	70000.00	2026-06-09 23:32:39.617+07	\N	1
b2e2d40d-2012-430a-aae3-584fe17977bf	b81769dc-d5ce-4e31-9cb9-6b0e837d2cca	60a77edc-289c-4dd2-8d54-f6a9ddc30506	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	gaji karyawan	70000.00	2026-06-10 18:59:51.301+07	\N	1
2cec5b8b-9761-412e-be4e-5ea1fbdd8cf4	44845b66-18e8-487b-9260-2b7e61627b3f	aafcdf57-efd3-495b-8a18-ede35fc574d8	5257d090-becc-4466-b5ef-51f81f9b7648	EXPENSE	pengiriman	70000.00	2026-06-10 19:06:02.413+07	\N	1
6a22ca94-a9c1-417e-a34b-6fb6d129c708	a8521426-bd96-4206-bf5c-6c493bd5db38	60a77edc-289c-4dd2-8d54-f6a9ddc30506	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	gaji karyawan 	70000.00	2026-06-10 19:06:49.275+07	\N	1
9b0f6160-705b-4824-998f-b7604eed6daf	4ff18ed3-aea8-4b92-8963-2eb3e2c288c4	aafcdf57-efd3-495b-8a18-ede35fc574d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	EXPENSE	beli tepung	14000.00	2026-06-10 19:08:53.393+07	\N	1
8b0c1485-5606-4ff7-ac05-e7c2822230a4	05b1aebb-6ef4-4dd5-8e4e-916548b2d184	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	aneka es (x1)	8000.00	2026-06-17 09:19:51.607502+07	\N	1
a7cffdf5-7e43-4916-98b5-39e1c674cdb7	66e8ffb9-19fb-4c4a-8ff3-6041b73207ef	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-10 19:40:17.012+07	\N	1
8e521467-1615-430d-b1b7-d0f99de29641	0544045d-86de-43a4-90ae-b9bbf14ccd56	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-12 08:30:33.245+07	\N	1
1c165e48-d728-4547-a4f9-83b6aa0a13b0	c565f4e3-1f9a-4b9f-853d-fede48d86fa1	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-12 08:50:06.448+07	\N	1
604f05c4-1d93-40c7-ac02-f96be9a4a8ae	a0ff6e4b-1888-401f-8a96-0f783d289805	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-12 10:24:51.231+07	\N	1
c97e4e9a-d83a-4d49-a743-dd2413d1bc2e	7b16e650-c29b-42f0-bdf0-ed918bd47cc5	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-12 10:27:18.472+07	\N	1
f03e5ca1-8750-437d-8341-66254a9ce99d	69779335-90dc-491d-94d7-1523c4294c8c	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal	140000.00	2026-06-12 12:53:01.925+07	\N	1
34f22d8d-bf22-4c20-8909-e5b2b698296a	49922388-ddd8-45e0-91f7-85fdb4dce99b	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	toyoherbal (x1)	140000.00	2026-06-12 17:03:09.088+07	\N	1
4df80b22-49f3-406f-b916-9c39cf54222a	70a95eab-471a-40e9-8b85-65b4d88ce937	941be909-57ed-4396-9a40-31b1027219d8	5257d090-becc-4466-b5ef-51f81f9b7648	INCOME	Kriptor Tortila toyoresmi (x1)	15000.00	2026-06-04 18:15:48.727+07	\N	1
8b917616-aef6-444c-9ffb-9bb2d1b07d04	dc4567e1-63bd-49f8-88a4-a21a0d2b47c4	941be909-57ed-4396-9a40-31b1027219d8	5257d090-becc-4466-b5ef-51f81f9b7648	INCOME	Kriptor Tortila toyoresmi (x2)	30000.00	2026-06-05 12:01:11.561+07	\N	2
7c9e273f-7f60-44d6-89c7-de00b40f0021	3dccf7f4-eb81-42dd-b92d-7b777d97ff20	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x2)	30000.00	2026-06-05 12:04:42.62+07	\N	2
56df5f64-d7bd-4040-a99a-e30a429e3d1a	4a5238a2-24e3-41dc-a38c-56101dbd80b2	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x2)	30000.00	2026-06-05 13:38:36.173+07	\N	2
a7b0fd70-aa77-4f00-848f-51528dfb4fd4	c45df4dd-0376-4e0c-9609-0f3629fa91de	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x1)	15000.00	2026-06-10 19:17:42.779+07	\N	1
603ed7b2-5e88-4421-a066-0d901e8dd407	66e8ffb9-19fb-4c4a-8ff3-6041b73207ef	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x1)	15000.00	2026-06-10 19:40:17.012+07	\N	1
ca72c741-975c-42d8-9dde-45208c2d3354	b1615ac4-8fee-46ea-bdb3-61a08308bc55	e9ad61ce-9602-41ea-872c-d270ab72065c	16de8c7f-47c9-4192-aa31-d059b13f23fc	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 00:16:58.237+07	\N	1
f48afb07-d86a-4a04-a821-f935a0e2701d	b1615ac4-8fee-46ea-bdb3-61a08308bc55	e9ad61ce-9602-41ea-872c-d270ab72065c	16de8c7f-47c9-4192-aa31-d059b13f23fc	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 00:16:58.237+07	\N	2
31aa0357-61f0-497d-aecb-a226571b2f8c	c565f4e3-1f9a-4b9f-853d-fede48d86fa1	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x1)	15000.00	2026-06-12 08:50:06.448+07	\N	1
c34908f7-aa20-41cf-9d5e-62cc544cc684	88d7c64e-4cba-4e32-b06c-c73b889cf2f1	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x3)	45000.00	2026-06-12 09:10:56.737+07	\N	3
f22430e2-541c-4166-b958-8a456810e85c	8fbf749a-8658-4fc7-aea1-805be6aaf575	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 12:49:38.529+07	\N	1
2a97d65a-2009-454b-9889-e231c28a6797	1de51467-6f06-4c16-9372-59ed90fd1867	e9ad61ce-9602-41ea-872c-d270ab72065c	16de8c7f-47c9-4192-aa31-d059b13f23fc	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 12:53:15.926+07	\N	1
78f1a79c-ff58-44f7-9166-abb879fb6850	78b89cfe-1a59-473a-b79d-3c641de72e2a	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 16:37:04.161+07	\N	1
ed142e0d-3c53-4d0f-aaf4-860b0b61829c	f2174f4d-33e8-4583-85d9-00c8182622da	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi	15000.00	2026-06-12 17:01:58.699+07	\N	1
a16c8307-4897-4f92-8a03-0ba608d6183c	49922388-ddd8-45e0-91f7-85fdb4dce99b	941be909-57ed-4396-9a40-31b1027219d8	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	Kriptor Tortila toyoresmi (x1)	15000.00	2026-06-12 17:03:09.088+07	\N	1
e7336c0a-192f-4f11-842e-9e205e803cc3	45f8b25f-6d65-4cae-b8d1-ae4c10691bf5	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-17 21:59:17.257575+07	db2be83e-f763-47eb-a78a-729abb215b41	1
c5c11b9d-29aa-4cb7-ad86-a9e52053ad00	169bbeda-9a89-40a3-ad27-fbd136b2ea87	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 02:11:28.852227+07	db2be83e-f763-47eb-a78a-729abb215b41	1
afb6a13c-be89-4992-8e46-34599cd712c8	2d9cfbde-6d9d-42db-a7e1-8fd0cf3911c1	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 02:37:36.529898+07	db2be83e-f763-47eb-a78a-729abb215b41	1
e748bc2e-3484-4d1c-8bf5-3f6cff0db3a8	02c7eb50-3a1a-4442-a80e-6bc135bfd161	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 10:21:32.406149+07	db2be83e-f763-47eb-a78a-729abb215b41	1
29715e97-b897-4109-84cc-63ac7d4f25ca	d64185d8-b857-4778-977a-7a1223b7b6dd	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 10:30:05.975858+07	db2be83e-f763-47eb-a78a-729abb215b41	1
f74f4b5c-30c5-4cc2-9111-7f5389d460ff	fffa5e6c-3836-4ec8-b0e7-6ef4ef743e5f	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 11:57:42.704131+07	db2be83e-f763-47eb-a78a-729abb215b41	1
d7b9c4f8-16f2-4fbb-904d-97095699deb0	8e7d00d4-90ac-485b-ab35-189f3eebd7ab	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x1)	8000.00	2026-06-18 12:00:23.73827+07	db2be83e-f763-47eb-a78a-729abb215b41	1
6ae5e86e-366a-43bd-a891-75ef146b0eb2	8755d00b-739e-435a-a50c-cb831eb77bbe	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es campur (x1)	8000.00	2026-06-18 15:50:45.405444+07	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	1
991d9e3a-c1ba-4527-9066-747e5bb09c97	82195575-00c5-4b9a-81f8-62d937364f4e	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es campur (x1)	8000.00	2026-06-18 16:10:58.779526+07	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	1
87cab9ee-d38e-48b6-9058-207306dc2733	389be0a0-09af-4f48-b06d-24adfc5dec0e	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es campur (x1)	8000.00	2026-06-18 16:14:32.883564+07	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	1
7df17f23-ba8f-45b7-999e-1a813d24a0d2	b1a9e75a-4dd5-45d1-9d48-2859fef2dcec	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es lilin (x3)	24000.00	2026-06-18 16:19:25.874527+07	db2be83e-f763-47eb-a78a-729abb215b41	3
5dcb5e81-530e-4931-b1b0-b2d6cbe2fe9a	17d5302c-1fe9-4f21-ac63-54cd6f3d9b6c	02d3a9d1-41c2-437f-a545-8abaabd658fa	f7581eb4-4ea1-468f-a700-b93a320570da	INCOME	Mango Milk (x1)	8000.00	2026-06-18 16:23:23.033026+07	15a98b09-9bd1-4d30-b278-05ce1e2180bc	1
c141d1b5-d8c8-4c3a-ad6b-ec9e1ea73c07	46c6f457-86aa-4f55-b771-a46199ad5a92	02d3a9d1-41c2-437f-a545-8abaabd658fa	f7581eb4-4ea1-468f-a700-b93a320570da	INCOME	Kopi Hitam (x1)	8000.00	2026-06-18 16:24:03.889363+07	984e22b5-5a38-4b91-b233-0b5649f44f6e	1
075b6498-1951-4840-be15-725f0da9ec96	f2ad3376-8dac-45af-b8cd-7d20c9c8ad9c	02d3a9d1-41c2-437f-a545-8abaabd658fa	f7581eb4-4ea1-468f-a700-b93a320570da	INCOME	Mango Milk (x1)	8000.00	2026-06-18 16:24:53.995591+07	15a98b09-9bd1-4d30-b278-05ce1e2180bc	1
cf1ed8d4-0014-4e5d-8b7a-13e005e053ec	29454c61-4e9f-46fa-b97f-6b2b5401b7b4	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es campur (x1)	8000.00	2026-06-18 16:25:16.278195+07	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	1
8a072e23-a38e-4422-82fa-e4a4a557d98c	0ebf1e98-47f5-4cf0-aabb-8072ab277ab4	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es campur (x1)	8000.00	2026-06-18 16:28:53.99131+07	c837e64f-2c1f-441e-b5eb-fcadb389cf1b	1
34586829-4793-4179-ba46-96a8bffefd21	0ebf1e98-47f5-4cf0-aabb-8072ab277ab4	e9ad61ce-9602-41ea-872c-d270ab72065c	3e40969c-0f35-4d5d-ad83-2d78e17b765c	INCOME	es camput (x1)	7000.00	2026-06-18 16:28:53.99131+07	328388df-2d44-473f-9688-a2b7a7d7a4b7	1
\.


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_stocks product_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: stock_mutations stock_mutations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_pkey PRIMARY KEY (id);


--
-- Name: transaction_attachments transaction_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_attachments
    ADD CONSTRAINT transaction_attachments_pkey PRIMARY KEY (id);


--
-- Name: transaction_groups transaction_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_groups
    ADD CONSTRAINT transaction_groups_pkey PRIMARY KEY (id);


--
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (id);


--
-- Name: categories_profile_id_name_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_profile_id_name_type_key ON public.categories USING btree (profile_id, name, type);


--
-- Name: orders_reference_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX orders_reference_number_key ON public.orders USING btree (reference_number);


--
-- Name: payment_methods_profile_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_methods_profile_id_name_key ON public.payment_methods USING btree (profile_id, name);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: product_categories_profile_id_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_categories_profile_id_name_key ON public.product_categories USING btree (profile_id, name);


--
-- Name: product_stocks_product_id_branch_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_stocks_product_id_branch_id_key ON public.product_stocks USING btree (product_id, branch_id);


--
-- Name: profiles_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);


--
-- Name: profiles_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: transaction_groups_reference_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX transaction_groups_reference_number_key ON public.transaction_groups USING btree (reference_number);


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: categories categories_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: orders orders_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: product_stocks product_stocks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: product_stocks product_stocks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: products products_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: stock_mutations stock_mutations_from_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_from_branch_id_fkey FOREIGN KEY (from_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: stock_mutations stock_mutations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_mutations stock_mutations_to_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_to_branch_id_fkey FOREIGN KEY (to_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: transaction_attachments transaction_attachments_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_attachments
    ADD CONSTRAINT transaction_attachments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.transaction_groups(id) ON DELETE CASCADE;


--
-- Name: transaction_groups transaction_groups_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_groups
    ADD CONSTRAINT transaction_groups_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: transaction_groups transaction_groups_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_groups
    ADD CONSTRAINT transaction_groups_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: transaction_items transaction_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.transaction_groups(id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;


--
-- Name: transaction_items transaction_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: product_stocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_mutations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_mutations ENABLE ROW LEVEL SECURITY;

--
-- Name: transaction_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: transaction_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transaction_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: transaction_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict niXFkbSeJmBTuPUc06qXSjMfWvAbRQXKmhyhA8zR8x0wmLc2OblnJ0pSfk2x6Uo

